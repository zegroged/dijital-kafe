import {
  apiHandler,
  assertDishInMenu,
  requireOwnerContext,
} from "@/lib/auth/guard";
import { fail, ok } from "@/lib/http";
import { revalidatePublicMenu } from "@/lib/menu-cache";
import { prisma } from "@/lib/prisma";
import { canCreateModel } from "@/lib/subscription/access";
import { getArCodeProvider } from "@/lib/services/arcode";
import { ModelStatus } from "@/generated/prisma/client";

export const runtime = "nodejs";

// ScanJob.status → ModelStatus enum.
function toModelStatus(status: string): ModelStatus {
  switch (status) {
    case "pending":
      return ModelStatus.pending;
    case "processing":
      return ModelStatus.processing;
    case "ready":
      return ModelStatus.ready;
    case "failed":
      return ModelStatus.failed;
    default:
      return ModelStatus.none;
  }
}

// Modeli ready'e geçir + kotayı SADECE ilk geçişte tam bir kez düş.
// updateMany'nin `modelStatus: { not: ready }` guard'ı satırı tek bir kez eşler;
// yarışan ikinci istek count=0 alır → kota çift sayılmaz (idempotent/TOCTOU-güvenli).
async function transitionToReady(
  dishId: string,
  glbUrl: string,
  usdzUrl: string | null,
  subscriptionId: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const res = await tx.dish.updateMany({
      where: { id: dishId, modelStatus: { not: ModelStatus.ready } },
      data: {
        model3dUrl: glbUrl,
        modelUsdzUrl: usdzUrl,
        modelStatus: ModelStatus.ready,
      },
    });
    if (res.count === 1 && subscriptionId) {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: { modelsUsed: { increment: 1 } },
      });
    }
  });
}

// POST /api/dishes/:id/model → 3D tarama başlat
export const POST = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { menu, subscription, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertDishInMenu(id, menu.id);

    const provider = getArCodeProvider();
    if (!provider.isConfigured()) {
      return fail("AR Code entegrasyonu henüz aktif değil", 409);
    }
    if (!canCreateModel(subscription)) {
      return fail("3D model kotanız doldu", 403);
    }

    const job = await provider.createScan({ dishId: id });

    // Sağlayıcı oluşturma anında ready + asset dönerse kotayı burada tüket.
    if (job.status === "ready" && job.asset) {
      await prisma.dish.update({
        where: { id },
        data: { arCodeAssetId: job.assetId },
      });
      await transitionToReady(
        id,
        job.asset.glbUrl,
        job.asset.usdzUrl ?? null,
        subscription?.id ?? null,
      );
      revalidatePublicMenu(restaurant.slug);
      return ok({ ok: true, status: "ready" });
    }

    // ready ama asset yok → GET finalize etsin diye processing'e indir.
    const status =
      job.status === "ready"
        ? ModelStatus.processing
        : toModelStatus(job.status);
    await prisma.dish.update({
      where: { id },
      data: { modelStatus: status, arCodeAssetId: job.assetId },
    });

    return ok({ ok: true, status });
  },
);

// GET /api/dishes/:id/model → durum sorgula (hazırsa kaydet)
export const GET = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { menu, subscription, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertDishInMenu(id, menu.id);

    const dish = await prisma.dish.findUnique({
      where: { id },
      select: {
        arCodeAssetId: true,
        modelStatus: true,
      },
    });

    if (!dish?.arCodeAssetId) {
      return ok({ ok: true, status: "none" });
    }

    const provider = getArCodeProvider();
    const job = await provider.getScan(dish.arCodeAssetId);
    const status = toModelStatus(job.status);

    if (status === ModelStatus.ready && job.asset) {
      await transitionToReady(
        id,
        job.asset.glbUrl,
        job.asset.usdzUrl ?? null,
        subscription?.id ?? null,
      );
      revalidatePublicMenu(restaurant.slug);
    } else if (status === ModelStatus.failed) {
      await prisma.dish.update({
        where: { id },
        data: { modelStatus: ModelStatus.failed },
      });
    }

    return ok({ ok: true, status, asset: job.asset });
  },
);

// DELETE /api/dishes/:id/model → modeli kaldır
export const DELETE = apiHandler<{ params: Promise<{ id: string }> }>(
  async (_req, ctx) => {
    const { menu, restaurant } = await requireOwnerContext();
    const { id } = await ctx.params;
    await assertDishInMenu(id, menu.id);

    await prisma.dish.update({
      where: { id },
      data: {
        model3dUrl: null,
        modelUsdzUrl: null,
        arCodeAssetId: null,
        modelStatus: ModelStatus.none,
      },
    });

    revalidatePublicMenu(restaurant.slug);

    return ok({ ok: true });
  },
);

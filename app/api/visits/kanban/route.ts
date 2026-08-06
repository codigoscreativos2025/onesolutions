import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
export const dynamic = 'force-dynamic';

const COMMON_FIELDS = [
  "closingDate", "paymentMethod", "primaryRep", "primaryRepCommPct",
  "generalCostPrice", "generalSalePrice",
];

const OPTIONAL_FIELDS = ["generalCostPrice", "generalSalePrice"];

const FILE_FIELD_KEYS = new Set([
  "electricBillUrl", "closingFormUrl", "homeInsuranceUrl", "homeTitleUrl",
  "idDocumentUrl", "nocUrl", "materialsOrderUrl", "roofReportUrl",
  "exteriorScopeUrl", "panelsPhotoUrl", "propertyPhotosJson",
]);

function computeProgress(
  projectDetails: Record<string, unknown> | null,
  fieldMetasByType: Record<number, { fieldName: string }[]>,
  projectTypeIds: number[],
  stage?: string
): number {
  if (!projectDetails) return 0;
  const isValid = (val: unknown) => {
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === "") return false;
    return true;
  };

  const requiredCommonFields = COMMON_FIELDS.filter((f) => !OPTIONAL_FIELDS.includes(f));
  let totalFields = requiredCommonFields.length;
  let completedFields = requiredCommonFields.filter((f) => isValid(projectDetails[f])).length;

  const billFields = ['_billClientName', '_billClientEmail', '_billPhone'];
  for (const field of billFields) {
    totalFields++;
    if (isValid(projectDetails[field])) {
      completedFields++;
    }
  }

  for (const field of OPTIONAL_FIELDS) {
    if (isValid(projectDetails[field])) {
      totalFields++;
      completedFields++;
    }
  }

  for (const ptId of projectTypeIds) {
    const metas = fieldMetasByType[ptId] || [];
    for (const meta of metas) {
      if (COMMON_FIELDS.includes(meta.fieldName) || FILE_FIELD_KEYS.has(meta.fieldName)) continue;
      totalFields++;
      if (isValid(projectDetails[meta.fieldName])) completedFields++;
    }
  }

  if (stage === "PROJECT" || stage === "CLOSED") {
    totalFields += 2;
    if (isValid(projectDetails["idDocumentUrl"])) completedFields++;
    if (isValid(projectDetails["electricBillUrl"])) completedFields++;
  }

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUserId = parseInt(session.user.id);
  const role = session.user.role;

  try {
    const whereClause: Record<string, unknown> = {};

    if (role === 'SETTER' || role === 'SETTER_JR') {
      whereClause.setterId = currentUserId;
      whereClause.stage = 'IN_PROGRESS';
    } else if (role === 'CLOSER') {
      const setterIds = await prisma.user.findMany({
        where: { closerId: currentUserId },
        select: { id: true },
      });
      const ids = setterIds.map((s) => s.id);
      whereClause.OR = [
        { closerId: currentUserId },
        { setterId: { in: [currentUserId, ...ids] } },
      ];
    } else if (role === 'PARTNER') {
      whereClause.parcel = { partnerId: currentUserId };
    }

    const visits = await prisma.visit.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        parcel: {
          select: {
            id: true,
            address: true,
            ownerName: true,
            parcelTags: true,
          },
        },
        setter: {
          select: { id: true, name: true },
        },
        closer: {
          select: { id: true, name: true },
        },
        projects: {
          include: {
            projectType: {
              select: { id: true, name: true },
            },
          },
        },
        projectDetails: true,
        bill: {
          select: { clientName: true, clientEmail: true, phone: true }
        }
      },
    });

    const allProjectTypeIds = new Set<number>();
    for (const v of visits) {
      for (const p of v.projects) {
        allProjectTypeIds.add(p.projectType.id);
      }
    }

    const commonsId = (await prisma.projectType.findFirst({
      where: { name: "Campos Comunes" },
      select: { id: true },
    }))?.id;

    if (commonsId) allProjectTypeIds.add(commonsId);

    const fieldMetasByType: Record<number, { fieldName: string }[]> = {};
    for (const ptId of Array.from(allProjectTypeIds)) {
      const fields = await prisma.projectTypeField.findMany({
        where: { projectTypeId: ptId },
        select: { fieldName: true },
      });
      fieldMetasByType[ptId] = fields;
    }

    const commonsFieldNames = commonsId
      ? (fieldMetasByType[commonsId] || []).map((f) => f.fieldName)
      : [];

    const enriched = visits.map((v) => ({
      id: v.id,
      stage: v.stage,
      createdAt: v.createdAt,
      parcel: v.parcel,
      setter: v.setter,
      closer: v.closer,
      projects: v.projects,
      projectDetails: v.projectDetails,
      progress: computeProgress(
        { ...(v.projectDetails || {}), _billClientName: v.bill?.clientName, _billClientEmail: v.bill?.clientEmail, _billPhone: v.bill?.phone } as Record<string, unknown>,
        fieldMetasByType,
        [...v.projects.map((p) => p.projectType.id), ...(commonsId ? [commonsId] : [])],
        v.stage
      ),
    }));    const grouped: Record<string, typeof enriched> = {
      IN_PROGRESS: [],
      PROPOSAL_ACCEPTED: [],
      PROJECT: [],
      CLOSED: [],
      CANCELLED: [],
    };

    for (const v of enriched) {
      if (v.stage in grouped) {
        grouped[v.stage].push(v);
      }
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching kanban data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

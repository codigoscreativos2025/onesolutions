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
  fieldMetasByType: Record<number, { fieldName: string; isRequired?: boolean }[]>,
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
      
      if (meta.isRequired === false) {
        if (isValid(projectDetails[meta.fieldName])) {
          totalFields++;
          completedFields++;
        }
      } else {
        totalFields++;
        if (isValid(projectDetails[meta.fieldName])) completedFields++;
      }
    }
  }

  if (stage === "PROJECT" || stage === "CLOSED") {
    totalFields += 2;
    if (isValid(projectDetails["idDocumentUrl"])) completedFields++;
    if (isValid(projectDetails["electricBillUrl"])) completedFields++;
  }

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter');

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  if (role !== 'CLOSER' && role !== 'ADMIN' && role !== 'SETTER' && role !== 'SETTER_JR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const whereClause: Record<string, unknown> = role === 'ADMIN'
      ? {}
      : role === 'CLOSER'
        ? { closerId: userId }
        : { setterId: userId };

    if (filter && filter !== 'all') {
      if (filter === 'leads') {
        whereClause.stage = 'PROPOSAL_ACCEPTED';
      } else if (filter === 'project') {
        whereClause.stage = 'PROJECT';
      } else if (filter === 'closed') {
        whereClause.stage = 'CLOSED';
      } else if (filter === 'cancelled') {
        whereClause.stage = 'CANCELLED';
      } else if (filter === 'objections') {
        whereClause.closerObjections = { some: {} };
      }
    } else {
      whereClause.stage = { in: ['PROPOSAL_ACCEPTED', 'PROJECT', 'CLOSED', 'CANCELLED'] };
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
        objections: {
          include: {
            objection: {
              select: { name: true, color: true },
            },
          },
        },
        closerObjections: {
          include: {
            closerObjection: {
              select: { name: true, color: true },
            },
          },
        },
        chatRoom: {
          select: { id: true },
        },
        bill: {
          select: {
            imageUrl: true,
            clientName: true,
            phone: true,
            clientEmail: true,
            additionalFileUrl: true,
            additionalFileName: true,
          },
        },
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

    const fieldMetasByType: Record<number, { fieldName: string; isRequired?: boolean }[]> = {};
    for (const ptId of Array.from(allProjectTypeIds)) {
      const fields = await prisma.projectTypeField.findMany({
        where: { projectTypeId: ptId },
        select: { fieldName: true, isRequired: true },
      });
      fieldMetasByType[ptId] = fields;
    }

    const enrichedVisits = visits.map((v) => ({
      ...v,
      progress: computeProgress(
        {
          ...((v.projectDetails as Record<string, unknown>) || {}),
          _billClientName: v.bill?.clientName,
          _billClientEmail: v.bill?.clientEmail,
          _billPhone: v.bill?.phone,
          electricBillUrl: (v.projectDetails as Record<string, unknown>)?.electricBillUrl || v.bill?.imageUrl,
          idDocumentUrl: (v.projectDetails as Record<string, unknown>)?.idDocumentUrl || v.bill?.additionalFileUrl,
        },
        fieldMetasByType,
        [...v.projects.map((p) => p.projectType.id), ...(commonsId ? [commonsId] : [])],
        v.stage
      ),
    }));

    return NextResponse.json(enrichedVisits);
  } catch (error) {
    console.error('Error fetching my projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

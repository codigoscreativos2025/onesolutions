"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  DoorOpen,
  Target,
  CheckCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useLocale } from "@/lib/locale-context";

interface Badge {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  phone?: string;
  avatarUrl?: string;
  closer?: { id: number; name: string } | null;
  setters?: { id: number; name: string }[];
  userBadges: {
    badge: Badge;
    earnedAt: string;
  }[];
  stats: {
    totalVisits: number;
    doorsKnocked: number;
    leadsGenerated: number;
    projectsClosed: number;
  };
  bestMonth: {
    month: string;
    count: number;
  } | null;
  availableBadges?: {
    id: number;
    name: string;
    icon: string;
    color: string;
    description: string;
    count: number;
  }[];
  profile?: {
    address?: string;
    ssn?: string;
    dateOfBirth?: string;
    bankName?: string;
    routingNumber?: string;
    zelle?: string;
    accountNumber?: string;
    profilePhoto?: string;
    representativeName?: string;
    companyName?: string;
    itinNumber?: string;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data: session } = useSession();
  const { t, locale } = useLocale();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwnProfile = session?.user?.id === userId;

  const [editForm, setEditForm] = useState({
    phone: "",
    address: "",
    dateOfBirth: "",
    bankName: "",
    zelle: "",
    accountNumber: "",
    ssn: "",
    routingNumber: "",
    representativeName: "",
    companyName: "",
    itinNumber: "",
  });
  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditForm({
      phone: profile.phone || "",
      address: profile.profile?.address || "",
      dateOfBirth: profile.profile?.dateOfBirth
        ? new Date(profile.profile.dateOfBirth).toISOString().split("T")[0]
        : "",
      bankName: profile.profile?.bankName || "",
      zelle: profile.profile?.zelle || "",
      accountNumber: profile.profile?.accountNumber || "",
      ssn: "",
      routingNumber: "",
      representativeName: profile.profile?.representativeName || "",
      companyName: profile.profile?.companyName || "",
      itinNumber: profile.profile?.itinNumber || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        phone: editForm.phone,
        address: editForm.address,
        dateOfBirth: editForm.dateOfBirth,
        bankName: editForm.bankName,
        zelle: editForm.zelle,
        accountNumber: editForm.accountNumber,
        representativeName: editForm.representativeName,
        companyName: editForm.companyName,
        itinNumber: editForm.itinNumber,
      };

      if (editForm.ssn) body.ssn = editForm.ssn;
      if (editForm.routingNumber) body.routingNumber = editForm.routingNumber;

      const res = await fetch(`/api/users/${userId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchProfile();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const maskSSN = (ssn: string) => {
    if (!ssn) return "";
    return "***-**-" + ssn.slice(-4);
  };

  const maskRouting = (routing: string) => {
    if (!routing) return "";
    return "*****" + routing.slice(-4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Usuario no encontrado</p>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "CLOSER":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex items-start gap-6 flex-1">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden relative shrink-0">
              {profile.profile?.profilePhoto ? (
                <Image
                  src={profile.profile.profilePhoto}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              ) : profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  fill
                  className="object-cover"
                />
              ) : (
                profile.name.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium uppercase tracking-wider">
                  {t.roles?.[profile.role as keyof typeof t.roles] ||
                    (profile.role === "SETTER" ? "Trainee" : profile.role)}
                </span>
                {isOwnProfile && (
                  <Button size="sm" variant="outline" onClick={openEditModal}>
                    <Pencil className="w-4 h-4" />
                    {t.profile.editProfile}
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {t.profile.memberSince}{" "}
                    {new Date(profile.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Medals on the right */}
          {profile.availableBadges && profile.availableBadges.length > 0 && (
            <div className="w-full md:w-auto md:min-w-[200px] flex flex-row md:flex-col gap-2 p-4 md:p-0 bg-gray-50 md:bg-transparent rounded-lg md:border-l md:border-gray-200 md:dark:border-gray-700 md:pl-6 overflow-x-auto">
              <h3 className="hidden md:block text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t.profile.badges}
              </h3>
              {profile.availableBadges.map((badge) => {
                const hasBadge = badge.count > 0;
                return (
                  <div
                    key={badge.id}
                    className={`flex items-center gap-3 p-2 rounded-lg border min-w-[140px] md:min-w-0 transition-all ${
                      hasBadge
                        ? "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60 grayscale"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 relative"
                      style={{
                        backgroundColor: hasBadge
                          ? badge.color + "20"
                          : "#cccccc20",
                      }}
                    >
                      {badge.icon}
                      {hasBadge && (
                        <div className="absolute -top-1 -right-1 bg-[#f48221] text-white text-[9px] font-bold px-1 py-0.5 rounded-full border border-white dark:border-gray-800 shadow-sm leading-none">
                          +{badge.count}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-semibold text-xs truncate ${hasBadge ? "" : "text-gray-500"}`}
                      >
                        {badge.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {(isOwnProfile || session?.user?.role === "ADMIN") &&
        profile.profile &&
        (profile.profile.address ||
          profile.profile.dateOfBirth ||
          profile.profile.bankName ||
          profile.profile.zelle ||
          profile.profile.accountNumber ||
          profile.profile.ssn ||
          profile.profile.routingNumber ||
          profile.profile.representativeName ||
          profile.profile.companyName) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">{t.profile.privateInfo}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.profile.address && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.address}</p>
                  <p className="font-medium">{profile.profile.address}</p>
                </div>
              )}
              {profile.profile.dateOfBirth && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.dob}</p>
                  <p className="font-medium">
                    {new Date(profile.profile.dateOfBirth).toLocaleDateString(
                      locale,
                    )}
                  </p>
                </div>
              )}
              {profile.profile.bankName && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.bank}</p>
                  <p className="font-medium">{profile.profile.bankName}</p>
                </div>
              )}
              {profile.profile.zelle && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.zelle}</p>
                  <p className="font-medium">{profile.profile.zelle}</p>
                </div>
              )}
              {profile.profile.accountNumber && (
                <div>
                  <p className="text-sm text-gray-500">
                    {t.profile.accountNumber}
                  </p>
                  <p className="font-medium">{profile.profile.accountNumber}</p>
                </div>
              )}
              {profile.profile.ssn && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.ssn}</p>
                  <p className="font-medium">{maskSSN(profile.profile.ssn)}</p>
                </div>
              )}
              {profile.profile.routingNumber && (
                <div>
                  <p className="text-sm text-gray-500">
                    {t.profile.routingNumber}
                  </p>
                  <p className="font-medium">
                    {maskRouting(profile.profile.routingNumber)}
                  </p>
                </div>
              )}
              {profile.profile.representativeName && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.repName}</p>
                  <p className="font-medium">
                    {profile.profile.representativeName}
                  </p>
                </div>
              )}
              {profile.profile.companyName && (
                <div>
                  <p className="text-sm text-gray-500">
                    {t.profile.companyName}
                  </p>
                  <p className="font-medium">{profile.profile.companyName}</p>
                </div>
              )}
              {profile.profile.itinNumber && (
                <div>
                  <p className="text-sm text-gray-500">{t.profile.itin}</p>
                  <p className="font-medium">{profile.profile.itinNumber}</p>
                </div>
              )}
            </div>
          </div>
        )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {t.profile.stats}
        </h2>

        <div className="flex flex-wrap gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DoorOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                {t.profile.doorsKnocked}
              </span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.doorsKnocked}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                {t.profile.leadsGenerated}
              </span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.leadsGenerated}</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                {t.profile.projectsClosed}
              </span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.projectsClosed}</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                {t.profile.totalVisits}
              </span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.totalVisits}</p>
          </div>
        </div>

        {profile.bestMonth && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>{t.profile.bestMonth}:</strong>{" "}
              {new Date(profile.bestMonth.month + "-01").toLocaleDateString(
                locale,
                { month: "long", year: "numeric" },
              )}{" "}
              {t.profile.with} {profile.bestMonth.count} {t.profile.visits}
            </p>
          </div>
        )}
      </div>

      {profile.role === "CLOSER" &&
        profile.setters &&
        profile.setters.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.profile.assignedTrainees}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.setters.map((setter) => (
                <Link
                  key={setter.id}
                  href={`/profile/${setter.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {setter.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{setter.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t.profile.editProfile}
      >
        <form
          onSubmit={handleSaveProfile}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <Input
            label={t.profile.phone}
            value={editForm.phone}
            onChange={(e) =>
              setEditForm({ ...editForm, phone: e.target.value })
            }
          />
          <Input
            label={t.profile.address}
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
          />
          <Input
            label={t.profile.dob}
            type="date"
            value={editForm.dateOfBirth}
            onChange={(e) =>
              setEditForm({ ...editForm, dateOfBirth: e.target.value })
            }
          />
          <Input
            label={t.profile.bank}
            value={editForm.bankName}
            onChange={(e) =>
              setEditForm({ ...editForm, bankName: e.target.value })
            }
          />
          <Input
            label={t.profile.zelle}
            value={editForm.zelle}
            onChange={(e) =>
              setEditForm({ ...editForm, zelle: e.target.value })
            }
          />
          <Input
            label={t.profile.accountNumber}
            value={editForm.accountNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, accountNumber: e.target.value })
            }
          />
          <Input
            label={t.profile.ssn}
            value={editForm.ssn}
            onChange={(e) => setEditForm({ ...editForm, ssn: e.target.value })}
            placeholder={
              profile.profile?.ssn
                ? maskSSN(profile.profile.ssn)
                : "XXX-XX-XXXX"
            }
          />
          <Input
            label={t.profile.routingNumber}
            value={editForm.routingNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, routingNumber: e.target.value })
            }
            placeholder={
              profile.profile?.routingNumber
                ? maskRouting(profile.profile.routingNumber)
                : ""
            }
          />
          <Input
            label={t.profile.repName}
            value={editForm.representativeName}
            onChange={(e) =>
              setEditForm({ ...editForm, representativeName: e.target.value })
            }
          />
          <Input
            label={t.profile.companyName}
            value={editForm.companyName}
            onChange={(e) =>
              setEditForm({ ...editForm, companyName: e.target.value })
            }
          />
          <Input
            label={t.profile.itin}
            value={editForm.itinNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, itinNumber: e.target.value })
            }
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#f48221] hover:bg-[#d6721d] text-white"
              disabled={submitting}
            >
              {submitting ? t.common.loading : t.profile.saveChanges}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

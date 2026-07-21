'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Mail, Phone, Calendar, Award, TrendingUp, DoorOpen, Target, CheckCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

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
  profile?: {
    address?: string;
    ssn?: string;
    dateOfBirth?: string;
    bankName?: string;
    routingNumber?: string;
    zelle?: string;
    accountNumber?: string;
    profilePhoto?: string;
  };
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isOwnProfile = session?.user?.id === userId;

  const [editForm, setEditForm] = useState({
    phone: '',
    address: '',
    dateOfBirth: '',
    bankName: '',
    zelle: '',
    accountNumber: '',
    ssn: '',
    routingNumber: '',
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
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!profile) return;
    setEditForm({
      phone: profile.phone || '',
      address: profile.profile?.address || '',
      dateOfBirth: profile.profile?.dateOfBirth
        ? new Date(profile.profile.dateOfBirth).toISOString().split('T')[0]
        : '',
      bankName: profile.profile?.bankName || '',
      zelle: profile.profile?.zelle || '',
      accountNumber: profile.profile?.accountNumber || '',
      ssn: '',
      routingNumber: '',
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
      };

      if (editForm.ssn) body.ssn = editForm.ssn;
      if (editForm.routingNumber) body.routingNumber = editForm.routingNumber;

      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    if (!ssn) return '';
    return '***-**-' + ssn.slice(-4);
  };

  const maskRouting = (routing: string) => {
    if (!routing) return '';
    return '*****' + routing.slice(-4);
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
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'CLOSER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold overflow-hidden relative">
            {profile.profile?.profilePhoto ? (
              <Image
                src={profile.profile.profilePhoto}
                alt={profile.name}
                fill
                className="object-cover"
              />
            ) : profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.name} fill className="object-cover" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(profile.role)}`}>
                {profile.role}
              </span>
              {isOwnProfile && (
                <Button size="sm" variant="outline" onClick={openEditModal}>
                  <Pencil className="w-4 h-4" />
                  Editar Perfil
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
                <span>Miembro desde {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOwnProfile && profile.profile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Mi Informaci&oacute;n</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.profile.address && (
              <div>
                <p className="text-sm text-gray-500">Direcci&oacute;n</p>
                <p className="font-medium">{profile.profile.address}</p>
              </div>
            )}
            {profile.profile.dateOfBirth && (
              <div>
                <p className="text-sm text-gray-500">Fecha de Nacimiento</p>
                <p className="font-medium">{new Date(profile.profile.dateOfBirth).toLocaleDateString()}</p>
              </div>
            )}
            {profile.profile.bankName && (
              <div>
                <p className="text-sm text-gray-500">Banco</p>
                <p className="font-medium">{profile.profile.bankName}</p>
              </div>
            )}
            {profile.profile.zelle && (
              <div>
                <p className="text-sm text-gray-500">Zelle</p>
                <p className="font-medium">{profile.profile.zelle}</p>
              </div>
            )}
            {profile.profile.accountNumber && (
              <div>
                <p className="text-sm text-gray-500">N&uacute;mero de Cuenta</p>
                <p className="font-medium">{profile.profile.accountNumber}</p>
              </div>
            )}
            {profile.profile.ssn && (
              <div>
                <p className="text-sm text-gray-500">SSN</p>
                <p className="font-medium">{maskSSN(profile.profile.ssn)}</p>
              </div>
            )}
            {profile.profile.routingNumber && (
              <div>
                <p className="text-sm text-gray-500">N&uacute;mero de Ruta</p>
                <p className="font-medium">{maskRouting(profile.profile.routingNumber)}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Estad&iacute;sticas
        </h2>

        <div className="flex flex-wrap gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DoorOpen className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Puertas Tocadas</span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.doorsKnocked}</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Leads Potenciales</span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.leadsGenerated}</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Proyectos Cerrados</span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.projectsClosed}</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 min-w-[80px] text-center flex-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Total Visitas</span>
            </div>
            <p className="text-2xl font-bold">{profile.stats.totalVisits}</p>
          </div>
        </div>

        {profile.bestMonth && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Mejor mes:</strong> {new Date(profile.bestMonth.month + '-01').toLocaleDateString('es', { month: 'long', year: 'numeric' })} con {profile.bestMonth.count} visitas
            </p>
          </div>
        )}
      </div>

      {profile.role === "CLOSER" && profile.setters && profile.setters.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Trainees Asignados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {profile.setters.map((setter) => (
              <Link key={setter.id} href={`/profile/${setter.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {setter.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{setter.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {profile.userBadges.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Medallas
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {profile.userBadges.map(({ badge }) => (
              <div
                key={badge.id}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: badge.color + '20' }}
                >
                  {badge.icon}
                </div>
                <div>
                  <p className="font-semibold">{badge.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Perfil"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input
            label="Teléfono"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Input
            label="Dirección"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <Input
            label="Fecha de Nacimiento"
            type="date"
            value={editForm.dateOfBirth}
            onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
          />
          <Input
            label="Banco"
            value={editForm.bankName}
            onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
          />
          <Input
            label="Zelle"
            value={editForm.zelle}
            onChange={(e) => setEditForm({ ...editForm, zelle: e.target.value })}
          />
          <Input
            label="Número de Cuenta"
            value={editForm.accountNumber}
            onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
          />
          <Input
            label="SSN"
            value={editForm.ssn}
            onChange={(e) => setEditForm({ ...editForm, ssn: e.target.value })}
            placeholder={profile.profile?.ssn ? maskSSN(profile.profile.ssn) : 'XXX-XX-XXXX'}
          />
          <Input
            label="Número de Ruta"
            value={editForm.routingNumber}
            onChange={(e) => setEditForm({ ...editForm, routingNumber: e.target.value })}
            placeholder={profile.profile?.routingNumber ? maskRouting(profile.profile.routingNumber) : ''}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" isLoading={submitting}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

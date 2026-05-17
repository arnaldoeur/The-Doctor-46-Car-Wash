import { format } from 'date-fns';
import { apiRequest } from './apiClient';
import type { ServiceItem } from './serviceCatalog';

export type AuthUserRecord = {
 id: string;
 email: string | null;
 user_metadata?: {
 full_name?: string | null;
 name?: string | null;
 phone?: string | null;
 } | null;
};

export type ProfileRow = {
 id: string;
 full_name: string | null;
 email: string | null;
 phone: string | null;
 account_type: 'customer' | 'staff';
 role: string;
 job_title: string | null;
 status: 'active' | 'inactive' | 'vacation';
 avatar_url: string | null;
 last_login_at: string | null;
 created_at: string;
 updated_at: string;
};

export type AppointmentRow = {
 id: string;
 customer_id: string;
 service_id: string;
 service_name: string;
 service_price_text: string;
 service_duration_text: string | null;
 appointment_date: string;
 appointment_time: string;
 status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
 vehicle_make: string;
 vehicle_model: string;
 vehicle_plate: string;
 contact_name: string;
 contact_email: string | null;
 contact_phone: string;
 loyalty_points_earned: number;
 created_at: string;
 updated_at: string;
};

type ProfileInput = {
 fullName?: string;
 email?: string;
 phone?: string;
};

type AppointmentInput = {
 userId: string;
 service: ServiceItem;
 selectedDate: Date;
 selectedTime: string;
 vehicleInfo: {
 make: string;
 model: string;
 plate: string;
 };
 personalInfo: {
 name: string;
 email: string;
 phone: string;
 };
};

function guessDisplayName(user: AuthUserRecord) {
 return (
 (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
 (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
 user.email?.split('@')[0] ||
 'Cliente'
 );
}

export async function ensureProfile(user: AuthUserRecord, input: ProfileInput = {}) {
 return apiRequest<ProfileRow>('customer.profile.save', {
 full_name: input.fullName ?? guessDisplayName(user),
 fullName: input.fullName ?? guessDisplayName(user),
 email: input.email ?? user.email ?? null,
 phone:
 input.phone ??
 (typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null),
 });
}

export async function listAppointments(_userId: string) {
 return apiRequest<AppointmentRow[]>('customer.appointments.list');
}

export async function createAppointment(input: AppointmentInput) {
 return apiRequest<AppointmentRow>('customer.appointment.create', {
 userId: input.userId,
 serviceId: input.service.id,
 serviceName: input.service.name,
 servicePriceText: input.service.price,
 serviceDurationText: input.service.duration,
 selectedDate: format(input.selectedDate, 'yy-MM-dd'),
 selectedTime: input.selectedTime,
 vehicleInfo: input.vehicleInfo,
 personalInfo: input.personalInfo,
 });
}

function formatMeticais(value: number) {
 return `${new Intl.NumberFormat('pt-MZ', {
 minimumFractionDigits: 0,
 maximumFractionDigits: 2,
 }).format(value)} MT`;
}

export async function fetchBookingServices() {
 const services = await apiRequest<
 Array<{
 id: string;
 name: string;
 category: string;
 description: string | null;
 base_price: number;
 promotional_price: number | null;
 is_promotional: boolean;
 duration_minutes: number | null;
 }>
 >('public.service_catalog');

 return services.map((service) => ({
 id: service.id,
 name: service.name,
 category: service.category,
 description: service.description || 'Servico disponivel na base de dados.',
 price: formatMeticais(
 service.is_promotional && service.promotional_price !== null
 ? service.promotional_price
 : service.base_price
 ),
 duration: service.duration_minutes ? `${service.duration_minutes} min` : 'Sob consulta',
 features: [],
 })) as ServiceItem[];
}

export function getAuthErrorMessage(message: string) {
 const normalizedMessage = message.toLowerCase();

 if (normalizedMessage.includes('invalid login credentials')) {
 return 'Email ou palavra-passe incorretos.';
 }

 if (normalizedMessage.includes('email not confirmed')) {
 return 'Confirme o seu email antes de entrar no portal.';
 }

 if (normalizedMessage.includes('user already registered')) {
 return 'Este email ja esta registado.';
 }

 if (normalizedMessage.includes('password should be at least')) {
 return 'A palavra-passe precisa de ter pelo menos 6 caracteres.';
 }

 return 'Nao foi possivel concluir a autenticacao agora. Tente novamente.';
}

import type { Lead, LeadFormErrors, LeadFormValues } from '../types/lead'
import { DEFAULT_CURRENCY } from '../constants/currency'

export const emptyLeadForm: LeadFormValues = {
  companyName: '',
  businessType: '',
  industry: '',
  website: '',
  address: '',
  city: '',
  country: '',
  ownerName: '',
  contactPerson: '',
  phone: '',
  email: '',
  socialMedia: { facebook: '', instagram: '', linkedin: '', other: '' },
  problemsFound: [],
  opportunities: [],
  servicesRequired: [],
  leadSource: 'other',
  status: 'new',
  priority: 'medium',
  assignedTo: '',
  dealValue: '',
  currency: DEFAULT_CURRENCY,
  notes: '',
}

/** Maps an existing lead onto the form shape, defaulting anything missing. */
export function leadToFormValues(lead: Lead): LeadFormValues {
  return {
    ...emptyLeadForm,
    companyName: lead.companyName ?? '',
    businessType: lead.businessType ?? '',
    industry: lead.industry ?? '',
    website: lead.website ?? '',
    address: lead.address ?? '',
    city: lead.city ?? '',
    country: lead.country ?? '',
    ownerName: lead.ownerName ?? '',
    contactPerson: lead.contactPerson ?? '',
    phone: lead.phone ?? '',
    email: lead.email ?? '',
    socialMedia: { ...emptyLeadForm.socialMedia, ...lead.socialMedia },
    problemsFound: lead.problemsFound ?? [],
    opportunities: lead.opportunities ?? [],
    servicesRequired: lead.servicesRequired ?? [],
    leadSource: lead.leadSource,
    status: lead.status,
    priority: lead.priority,
    assignedTo: lead.assignedTo?.id ?? '',
    dealValue: lead.dealValue === null ? '' : String(lead.dealValue),
    currency: lead.currency ?? DEFAULT_CURRENCY,
    // Notes live in their own records now; the edit form does not show them.
    notes: '',
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Permissive on formatting, strict on digit count: "+92 300 1234567", "(042) 111-222-333". */
function isLikelyPhone(value: string): boolean {
  if (!/^[+(]?[\d\s().-]+$/.test(value)) return false
  const digitCount = value.replace(/\D/g, '').length
  return digitCount >= 7 && digitCount <= 15
}

/** Accepts "example.com" as well as a full URL, since managers paste both. */
function isLikelyUrl(value: string): boolean {
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/.test(value)
}

export function validateLeadForm(values: LeadFormValues): LeadFormErrors {
  const errors: LeadFormErrors = {}

  if (!values.companyName.trim()) {
    errors.companyName = 'Company name is required'
  } else if (values.companyName.trim().length > 200) {
    errors.companyName = 'Company name cannot exceed 200 characters'
  }

  if (values.dealValue.trim()) {
    const amount = Number(values.dealValue)
    if (!Number.isFinite(amount) || amount < 0) {
      errors.dealValue = 'Enter an amount of zero or more'
    }
  }

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address'
  }

  if (values.phone.trim() && !isLikelyPhone(values.phone.trim())) {
    errors.phone = 'Enter a valid phone number'
  }

  if (values.website.trim() && !isLikelyUrl(values.website.trim())) {
    errors.website = 'Enter a valid website address'
  }

  for (const key of ['facebook', 'instagram', 'linkedin', 'other'] as const) {
    const value = values.socialMedia[key].trim()
    // A handle like "@company" is fine; anything with a dot should look like a link.
    if (value && value.includes('.') && !isLikelyUrl(value)) {
      errors[`socialMedia.${key}`] = 'Enter a valid link or handle'
    }
  }

  return errors
}

/** Trims every string so the API never stores stray whitespace. */
export function normaliseLeadForm(values: LeadFormValues): LeadFormValues {
  return {
    ...values,
    companyName: values.companyName.trim(),
    businessType: values.businessType.trim(),
    industry: values.industry.trim(),
    website: values.website.trim(),
    address: values.address.trim(),
    city: values.city.trim(),
    country: values.country.trim(),
    ownerName: values.ownerName.trim(),
    contactPerson: values.contactPerson.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    assignedTo: values.assignedTo,
    dealValue: values.dealValue.trim(),
    socialMedia: {
      facebook: values.socialMedia.facebook.trim(),
      instagram: values.socialMedia.instagram.trim(),
      linkedin: values.socialMedia.linkedin.trim(),
      other: values.socialMedia.other.trim(),
    },
  }
}

import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDuplicateLeads } from '../../api/leads'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import {
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
} from '../../constants/lead'
import type { AssignedUser, LeadFormErrors, LeadFormValues } from '../../types/lead'
import type { LeadPriority, LeadSource, LeadStatus } from '../../constants/lead'
import { normaliseLeadForm, validateLeadForm } from '../../utils/leadForm'
import { CURRENCIES, CURRENCY_LABELS, currencyForCountry } from '../../constants/currency'
import DuplicateWarning from './DuplicateWarning'
import FormSection from '../form/FormSection'
import TextField from '../form/TextField'
import TextAreaField from '../form/TextAreaField'
import SelectField from '../form/SelectField'
import TagInput from '../form/TagInput'

interface LeadFormProps {
  /** Everyone who can be assigned this lead. */
  managers: AssignedUser[]
  /** The lead being edited, so it does not match itself as a duplicate. */
  leadId?: string
  /** Adding a lead offers a first note; editing manages notes on its own page. */
  showInitialNote?: boolean
  initialValues: LeadFormValues
  submitLabel: string
  isSubmitting: boolean
  /** Field errors returned by the API, merged with client-side validation. */
  serverErrors?: LeadFormErrors
  serverMessage?: string
  onSubmit: (values: LeadFormValues) => void
  onCancel: () => void
}

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }))

export default function LeadForm({
  managers,
  leadId,
  showInitialNote,
  initialValues,
  submitLabel,
  isSubmitting,
  serverErrors,
  serverMessage,
  onSubmit,
  onCancel,
}: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>(initialValues)
  const [errors, setErrors] = useState<LeadFormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  // Fields edited since the server rejected them; their server error is stale.
  const [editedFields, setEditedFields] = useState<string[]>([])
  const [currencyTouched, setCurrencyTouched] = useState(false)

  // Look for existing leads with the same company, phone or email.
  const duplicateKey = useDebouncedValue(
    `${values.companyName.trim()}|${values.phone.trim()}|${values.email.trim()}`,
    500,
  )
  const [company, phone, email] = duplicateKey.split('|')
  const duplicatesQuery = useQuery({
    queryKey: ['leadDuplicates', duplicateKey, leadId],
    queryFn: () => fetchDuplicateLeads({ companyName: company, phone, email, excludeId: leadId }),
    enabled: Boolean(company || phone || email),
    staleTime: 30_000,
  })

  const visibleServerErrors = Object.fromEntries(
    Object.entries(serverErrors ?? {}).filter(([field]) => !editedFields.includes(field)),
  )
  const allErrors: LeadFormErrors = { ...visibleServerErrors, ...errors }

  const markEdited = (field: string) => {
    setEditedFields((current) => (current.includes(field) ? current : [...current, field]))
  }

  const revalidate = (next: LeadFormValues) => {
    if (hasSubmitted) setErrors(validateLeadForm(next))
  }

  const setField = <K extends keyof LeadFormValues>(key: K, value: LeadFormValues[K]) => {
    const next = { ...values, [key]: value }
    setValues(next)
    markEdited(String(key))
    revalidate(next)
  }

  /**
   * Typing a country suggests its currency, unless the manager already picked
   * one themselves — their choice always wins.
   */
  const setCountry = (country: string) => {
    const suggested = currencyForCountry(country)
    const next = {
      ...values,
      country,
      ...(suggested && !currencyTouched ? { currency: suggested } : {}),
    }
    setValues(next)
    markEdited('country')
    revalidate(next)
  }

  const setSocial = (key: keyof LeadFormValues['socialMedia'], value: string) => {
    const next = { ...values, socialMedia: { ...values.socialMedia, [key]: value } }
    setValues(next)
    markEdited(`socialMedia.${key}`)
    revalidate(next)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setHasSubmitted(true)
    // A fresh submit means any incoming server errors are current again.
    setEditedFields([])

    const normalised = normaliseLeadForm(values)
    const validationErrors = validateLeadForm(normalised)
    setErrors(validationErrors)

    const firstError = Object.keys(validationErrors)[0]
    if (firstError) {
      document.getElementById(firstError.replace('.', '-'))?.focus()
      return
    }

    onSubmit(normalised)
  }

  const errorCount = Object.keys(allErrors).length

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <DuplicateWarning duplicates={duplicatesQuery.data ?? []} />

        {(serverMessage || (hasSubmitted && errorCount > 0)) && (
          <div className="border-b border-rose-200 bg-rose-50 px-4 py-3 sm:px-6" role="alert">
            <p className="text-sm font-medium text-rose-800">
              {serverMessage ?? 'Please fix the highlighted fields before saving.'}
            </p>
          </div>
        )}

        <FormSection title="Company Information" description="Who the business is and where to find them.">
          <TextField
            id="companyName"
            label="Company name"
            required
            value={values.companyName}
            error={allErrors.companyName}
            onChange={(value) => setField('companyName', value)}
            placeholder="Karachi Dental Care"
          />
          <TextField
            id="businessType"
            label="Business type"
            value={values.businessType}
            error={allErrors.businessType}
            onChange={(value) => setField('businessType', value)}
            placeholder="Dental clinic"
          />
          <TextField
            id="industry"
            label="Industry"
            value={values.industry}
            error={allErrors.industry}
            onChange={(value) => setField('industry', value)}
            placeholder="Healthcare"
          />
          <TextField
            id="website"
            label="Website"
            type="url"
            value={values.website}
            error={allErrors.website}
            onChange={(value) => setField('website', value)}
            placeholder="example.com"
          />
          <TextField
            id="address"
            label="Address"
            fullWidth
            value={values.address}
            error={allErrors.address}
            onChange={(value) => setField('address', value)}
            placeholder="12 Shahrah-e-Faisal"
          />
          <TextField
            id="city"
            label="City"
            value={values.city}
            error={allErrors.city}
            onChange={(value) => setField('city', value)}
          />
          <TextField
            id="country"
            label="Country"
            value={values.country}
            error={allErrors.country}
            hint="Sets the currency below"
            onChange={setCountry}
          />
        </FormSection>

        <FormSection title="Contact Information" description="How to reach the decision maker.">
          <TextField
            id="ownerName"
            label="Owner"
            value={values.ownerName}
            error={allErrors.ownerName}
            onChange={(value) => setField('ownerName', value)}
          />
          <TextField
            id="contactPerson"
            label="Contact person"
            value={values.contactPerson}
            error={allErrors.contactPerson}
            onChange={(value) => setField('contactPerson', value)}
          />
          <TextField
            id="phone"
            label="Phone"
            type="tel"
            value={values.phone}
            error={allErrors.phone}
            onChange={(value) => setField('phone', value)}
            placeholder="+92 300 1234567"
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            value={values.email}
            error={allErrors.email}
            onChange={(value) => setField('email', value)}
            placeholder="info@example.com"
          />
        </FormSection>

        <FormSection title="Online Presence" description="Paste a link or a handle for each profile.">
          <TextField
            id="socialMedia-facebook"
            label="Facebook"
            value={values.socialMedia.facebook}
            error={allErrors['socialMedia.facebook']}
            onChange={(value) => setSocial('facebook', value)}
          />
          <TextField
            id="socialMedia-instagram"
            label="Instagram"
            value={values.socialMedia.instagram}
            error={allErrors['socialMedia.instagram']}
            onChange={(value) => setSocial('instagram', value)}
          />
          <TextField
            id="socialMedia-linkedin"
            label="LinkedIn"
            value={values.socialMedia.linkedin}
            error={allErrors['socialMedia.linkedin']}
            onChange={(value) => setSocial('linkedin', value)}
          />
          <TextField
            id="socialMedia-other"
            label="Other link"
            value={values.socialMedia.other}
            error={allErrors['socialMedia.other']}
            onChange={(value) => setSocial('other', value)}
          />
        </FormSection>

        <FormSection
          title="Business Analysis"
          description="What is wrong today and what you can sell them."
        >
          <TagInput
            id="problemsFound"
            label="Problems found"
            values={values.problemsFound}
            onChange={(value) => setField('problemsFound', value)}
            placeholder="No mobile version"
          />
          <TagInput
            id="opportunities"
            label="Opportunities"
            values={values.opportunities}
            onChange={(value) => setField('opportunities', value)}
            placeholder="Local SEO"
          />
          <TagInput
            id="servicesRequired"
            label="Services required"
            values={values.servicesRequired}
            onChange={(value) => setField('servicesRequired', value)}
            placeholder="Website redesign"
          />
        </FormSection>

        <FormSection title="Sales Information" description="Where this lead sits in your pipeline.">
          <SelectField
            id="leadSource"
            label="Lead source"
            value={values.leadSource}
            options={toOptions(LEAD_SOURCES, LEAD_SOURCE_LABELS)}
            onChange={(value) => setField('leadSource', value as LeadSource)}
          />
          <SelectField
            id="status"
            label="Status"
            value={values.status}
            options={toOptions(LEAD_STATUSES, LEAD_STATUS_LABELS)}
            onChange={(value) => setField('status', value as LeadStatus)}
          />
          <SelectField
            id="priority"
            label="Priority"
            value={values.priority}
            options={toOptions(LEAD_PRIORITIES, LEAD_PRIORITY_LABELS)}
            onChange={(value) => setField('priority', value as LeadPriority)}
          />
          <SelectField
            id="assignedTo"
            label="Assigned manager"
            value={values.assignedTo}
            error={allErrors.assignedTo}
            hint={managers.length === 0 ? 'No user accounts yet' : undefined}
            options={[
              { value: '', label: 'Unassigned' },
              ...managers.map((user) => ({ value: user.id, label: user.name })),
            ]}
            onChange={(value) => setField('assignedTo', value)}
          />
          <TextField
            id="dealValue"
            label="Deal value"
            type="text"
            value={values.dealValue}
            error={allErrors.dealValue}
            hint="Leave blank until you know it"
            onChange={(value) => setField('dealValue', value)}
            placeholder="1500"
          />
          <SelectField
            id="currency"
            label="Currency"
            value={values.currency}
            options={CURRENCIES.map((code) => ({ value: code, label: CURRENCY_LABELS[code] }))}
            onChange={(value) => {
              setCurrencyTouched(true)
              setField('currency', value as LeadFormValues['currency'])
            }}
          />
          {showInitialNote && (
            <TextAreaField
              id="notes"
              label="First note"
              value={values.notes}
              error={allErrors.notes}
              onChange={(value) => setField('notes', value)}
              placeholder="Anything useful for the first conversation…"
            />
          )}
        </FormSection>

        <div className="flex flex-wrap items-center justify-end gap-3 bg-slate-50 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  )
}

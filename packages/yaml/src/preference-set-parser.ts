import type {
  PreferenceSet,
  RoleFamily,
  RoleLevel,
  WorkMode,
  PreferenceStrength,
  WorkModeTarget,
  GeographyTarget,
  LanguageTarget,
  CompensationTarget,
  CompanyRef,
  LocationConstraint,
} from '@provena/core'

const VALID_ROLE_FAMILIES = new Set<RoleFamily>([
  'software-engineering',
  'ai-engineering',
  'project-management',
  'executive-management',
  'academia',
])

const VALID_ROLE_LEVELS = new Set<RoleLevel>([
  'junior',
  'mid',
  'senior',
  'staff',
  'principal',
  'executive',
])

const VALID_WORK_MODES = new Set<WorkMode>(['remote', 'hybrid', 'onsite'])
const VALID_STRENGTHS = new Set<PreferenceStrength>(['required', 'preferred'])

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function parseStringArray(arr: unknown, fieldName: string, file: string): string[] | undefined {
  if (arr === undefined || arr === null) return undefined
  if (!Array.isArray(arr)) throw new Error(`${file}: ${fieldName} must be an array`)
  return arr.map((item, i) => {
    if (typeof item !== 'string') throw new Error(`${file}: ${fieldName}[${i}] must be a string`)
    return item
  })
}

function parseRoleFamilies(raw: unknown, file: string): RoleFamily[] | undefined {
  const list = parseStringArray(raw, 'targets.roleFamilies', file)
  if (!list) return undefined
  return list.map((item, i) => {
    if (!VALID_ROLE_FAMILIES.has(item as RoleFamily)) {
      throw new Error(`${file}: invalid roleFamily "${item}" at targets.roleFamilies[${i}]. Allowed: ${[...VALID_ROLE_FAMILIES].join(', ')}`)
    }
    return item as RoleFamily
  })
}

function parseRoleLevels(raw: unknown, file: string): RoleLevel[] | undefined {
  const list = parseStringArray(raw, 'targets.roleLevels', file)
  if (!list) return undefined
  return list.map((item, i) => {
    if (!VALID_ROLE_LEVELS.has(item as RoleLevel)) {
      throw new Error(`${file}: invalid roleLevel "${item}" at targets.roleLevels[${i}]. Allowed: ${[...VALID_ROLE_LEVELS].join(', ')}`)
    }
    return item as RoleLevel
  })
}

function parseWorkModes(raw: unknown, file: string): WorkModeTarget[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) throw new Error(`${file}: targets.workModes must be an array`)
  return raw.map((item, i) => {
    if (!isObject(item)) throw new Error(`${file}: targets.workModes[${i}] must be an object`)
    const mode = String(item.mode ?? '')
    const strength = String(item.strength ?? 'required')

    if (!VALID_WORK_MODES.has(mode as WorkMode)) {
      throw new Error(`${file}: invalid workMode "${mode}" at targets.workModes[${i}]. Allowed: ${[...VALID_WORK_MODES].join(', ')}`)
    }
    if (!VALID_STRENGTHS.has(strength as PreferenceStrength)) {
      throw new Error(`${file}: invalid strength "${strength}" at targets.workModes[${i}]. Allowed: ${[...VALID_STRENGTHS].join(', ')}`)
    }

    return {
      mode: mode as WorkMode,
      strength: strength as PreferenceStrength,
    }
  })
}

function parseGeographies(raw: unknown, file: string): GeographyTarget[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) throw new Error(`${file}: targets.geographies must be an array`)
  return raw.map((item, i) => {
    if (!isObject(item)) throw new Error(`${file}: targets.geographies[${i}] must be an object`)
    return {
      ...(typeof item.continent === 'string' ? { continent: item.continent } : {}),
      ...(typeof item.country === 'string' ? { country: item.country } : {}),
      ...(typeof item.city === 'string' ? { city: item.city } : {}),
    }
  })
}

function parseLanguages(raw: unknown, file: string): LanguageTarget[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) throw new Error(`${file}: targets.languages must be an array`)
  return raw.map((item, i) => {
    if (!isObject(item)) throw new Error(`${file}: targets.languages[${i}] must be an object`)
    const code = String(item.code ?? '')
    const proficiency = String(item.proficiency ?? 'working')
    if (!code) throw new Error(`${file}: targets.languages[${i}].code is required`)
    return {
      code,
      proficiency: proficiency as LanguageTarget['proficiency'],
    }
  })
}

function parseCompensation(raw: unknown, file: string): CompensationTarget | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!isObject(raw)) throw new Error(`${file}: targets.compensation must be an object`)
  const minimum = Number(raw.minimum)
  if (isNaN(minimum)) throw new Error(`${file}: targets.compensation.minimum must be a number`)
  let currency: 'EUR' | 'USD' = 'EUR'
  if (raw.currency === '$' || raw.currency === 'USD') currency = 'USD'

  return {
    minimum,
    ...(typeof raw.preferred === 'number' ? { preferred: raw.preferred } : {}),
    currency,
  }
}

function parseExcludedCompanies(raw: unknown, file: string): CompanyRef[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) throw new Error(`${file}: constraints.excludedCompanies must be an array`)
  return raw.map((item, i) => {
    if (typeof item === 'string') return { name: item }
    if (isObject(item) && typeof item.name === 'string') {
      return {
        name: item.name,
        ...(typeof item.domain === 'string' ? { domain: item.domain } : {}),
      }
    }
    throw new Error(`${file}: constraints.excludedCompanies[${i}] must be a string or object with name`)
  })
}

function parseExcludedRoleFamilies(raw: unknown, file: string): RoleFamily[] | undefined {
  const list = parseStringArray(raw, 'constraints.excludedRoleFamilies', file)
  if (!list) return undefined
  return list.map((item, i) => {
    if (!VALID_ROLE_FAMILIES.has(item as RoleFamily)) {
      throw new Error(`${file}: invalid roleFamily "${item}" at constraints.excludedRoleFamilies[${i}]`)
    }
    return item as RoleFamily
  })
}

function parseExcludedLocations(raw: unknown, file: string): LocationConstraint[] | undefined {
  if (raw === undefined || raw === null) return undefined
  if (!Array.isArray(raw)) throw new Error(`${file}: constraints.excludedLocations must be an array`)
  return raw.map((item, i) => {
    if (!isObject(item)) throw new Error(`${file}: constraints.excludedLocations[${i}] must be an object`)
    return {
      ...(typeof item.country === 'string' ? { country: item.country } : {}),
      ...(typeof item.city === 'string' ? { city: item.city } : {}),
    }
  })
}

/**
 * Parses raw YAML object into structured PreferenceSet.
 * Enforces strict domain vocabulary and rejects invalid values.
 */
export function parsePreferenceSet(raw: unknown, file = 'preferences.yaml'): PreferenceSet | null {
  if (!raw || typeof raw !== 'object') return null
  const v = raw as Record<string, unknown>

  // Detect whether YAML is new structured PreferenceSet or legacy Preferences format
  const isStructured = 'targets' in v || 'constraints' in v
  if (!isStructured) {
    // Fallback: parse legacy preferences into PreferenceSet + legacy avoid terms
    const rolesRaw = parseStringArray(v.roles, 'roles', file)
    const remoteRaw = isObject(v.work) ? String(v.work.remote ?? '') : undefined
    const compRaw = isObject(v.compensation) ? v.compensation : undefined
    const avoidRaw = parseStringArray(v.avoid, 'avoid', file)

    return {
      targets: {
        ...(rolesRaw ? { roleFamilies: ['software-engineering'] } : {}),
        ...(remoteRaw ? { workModes: [{ mode: (remoteRaw === 'required' ? 'remote' : 'hybrid') as WorkMode, strength: 'required' }] } : {}),
        ...(compRaw && typeof compRaw.minimum === 'number' ? {
          compensation: {
            minimum: compRaw.minimum,
            currency: (compRaw.currency === '$' || compRaw.currency === 'USD') ? 'USD' : 'EUR',
          },
        } : {}),
      },
      constraints: {
        ...(avoidRaw ? { legacyAvoidTerms: avoidRaw } : {}),
      },
    }
  }

  const targetsObj = isObject(v.targets) ? v.targets : {}
  const constraintsObj = isObject(v.constraints) ? v.constraints : {}

  const roleFamilies = parseRoleFamilies(targetsObj.roleFamilies, file)
  const roleLevels = parseRoleLevels(targetsObj.roleLevels, file)
  const workModes = parseWorkModes(targetsObj.workModes, file)
  const geographies = parseGeographies(targetsObj.geographies, file)
  const languages = parseLanguages(targetsObj.languages, file)
  const compensation = parseCompensation(targetsObj.compensation, file)

  const excludedCompanies = parseExcludedCompanies(constraintsObj.excludedCompanies, file)
  const excludedRoleFamilies = parseExcludedRoleFamilies(constraintsObj.excludedRoleFamilies, file)
  const excludedLocations = parseExcludedLocations(constraintsObj.excludedLocations, file)
  const legacyAvoidTerms = parseStringArray(constraintsObj.legacyAvoidTerms, 'constraints.legacyAvoidTerms', file)
  const visaSponsorshipRequired = typeof constraintsObj.visaSponsorshipRequired === 'boolean'
    ? constraintsObj.visaSponsorshipRequired
    : undefined

  return {
    targets: {
      ...(roleFamilies ? { roleFamilies } : {}),
      ...(roleLevels ? { roleLevels } : {}),
      ...(workModes ? { workModes } : {}),
      ...(geographies ? { geographies } : {}),
      ...(languages ? { languages } : {}),
      ...(compensation ? { compensation } : {}),
    },
    constraints: {
      ...(excludedCompanies ? { excludedCompanies } : {}),
      ...(excludedRoleFamilies ? { excludedRoleFamilies } : {}),
      ...(excludedLocations ? { excludedLocations } : {}),
      ...(visaSponsorshipRequired !== undefined ? { visaSponsorshipRequired } : {}),
      ...(legacyAvoidTerms ? { legacyAvoidTerms } : {}),
    },
  }
}

/**
 * moduleAccess.ts — Centralized role-based module access control
 *
 * General Modules (M1, M2): Visible to ALL roles
 * Selective Modules (M3, M4, M5): Visible only to full-access roles OR
 *   users who have been explicitly granted access by an admin.
 */

export const GENERAL_MODULES = ['module-1', 'module-2'];
export const SELECTIVE_MODULES = ['module-3', 'module-4', 'module-5', 'educators'];
export const ALL_TRAINING_MODULES = [...GENERAL_MODULES, ...SELECTIVE_MODULES];

/** Roles that automatically get access to every training module */
export const FULL_ACCESS_ROLES = ['counsellor', 'admin', 'moderator'];

/**
 * Returns the list of module IDs a user is allowed to access.
 *
 * @param role          - The user's role from their profile
 * @param allowedModules - Admin-granted selective module IDs (from profiles.allowed_modules)
 */
export function getAccessibleModuleIds(
    role: string,
    allowedModules: string[] = []
): string[] {
    // Full-access roles see everything
    if (FULL_ACCESS_ROLES.includes(role)) {
        return [...ALL_TRAINING_MODULES];
    }

    // Other roles: general modules + only admin-granted selective modules
    const granted = allowedModules.filter(m => SELECTIVE_MODULES.includes(m));
    return [...GENERAL_MODULES, ...granted];
}

/**
 * Checks whether a specific module is accessible for a given user.
 */
export function canAccessModule(
    moduleId: string,
    role: string,
    allowedModules: string[] = []
): boolean {
    // resource-bank is always accessible
    if (moduleId === 'resource-bank') return true;

    return getAccessibleModuleIds(role, allowedModules).includes(moduleId);
}

/**
 * Readable labels for the selective modules (used in admin UI).
 */
export const SELECTIVE_MODULE_LABELS: Record<string, string> = {
    'module-3': 'Module 3: Consultation Training',
    'module-4': 'Module 4: Dashboard Training',
    'module-5': 'Module 5: Sales Skill Training',
    'educators': 'Educators Module',
};


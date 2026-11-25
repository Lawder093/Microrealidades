export type EcosystemContext = {
  profile: { user_id: string; display_name: string; bio: string };
  permissions: { superadmin: boolean; author: boolean; editor: boolean };
  organizations: Array<{
    id: string;
    name: string;
    status: string;
    role: string;
  }>;
  workspaces: Array<{
    id: string;
    name: string;
    organization_id: string;
    is_active: boolean;
  }>;
  modules: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    route: string;
    permission: string;
    configuration: Record<string, unknown>;
  }>;
  access: Array<{ workspace_id: string; module_id: string; allowed: boolean }>;
};
export const isUuid = (value: string): boolean =>
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);

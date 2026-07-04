/**
 * Maps RPC response from get_user_organizations to expected format
 * RPC returns: organization_id, organization_name, organization_slug, user_role, plan, member_count
 * We expect: id, name, slug, role, plan, member_count
 */
export function mapOrgResponse(rpcResponse: any) {
  if (!rpcResponse) return null;
  
  return {
    id: rpcResponse.organization_id,
    name: rpcResponse.organization_name,
    slug: rpcResponse.organization_slug,
    role: rpcResponse.user_role,
    plan: rpcResponse.plan,
    member_count: rpcResponse.member_count
  };
}

export function mapOrgsResponse(rpcResponses: any[]) {
  if (!rpcResponses || rpcResponses.length === 0) return [];
  
  return rpcResponses.map(mapOrgResponse);
}

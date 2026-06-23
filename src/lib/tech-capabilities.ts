import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  normalizeTechCapabilityInput,
  validateTechCapabilityInput,
} from "@/lib/tech-capability-validation";
import type {
  TechCapability,
  TechCapabilityFilters,
  TechCapabilityInput,
} from "@/lib/tech-capability-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

export async function listTechCapabilities(
  filters: TechCapabilityFilters = {},
): Promise<FetchResult<TechCapability[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    let query = supabase
      .from("it_tech_capabilities")
      .select("*")
      .order("updated_at", { ascending: false });

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.maturity) {
      query = query.eq("maturity", filters.maturity);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters.owner_id) {
      query = query.eq("owner_id", filters.owner_id);
    }
    if (filters.search?.trim()) {
      query = query.ilike("name", `%${filters.search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data ?? []) as TechCapability[], error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "기술 확보 목록 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function getTechCapability(
  id: string,
): Promise<FetchResult<TechCapability | null>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_tech_capabilities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data as TechCapability | null) ?? null, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "기술 확보 조회에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function createTechCapability(
  input: TechCapabilityInput,
): Promise<FetchResult<TechCapability | null>> {
  const validationError = validateTechCapabilityInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeTechCapabilityInput(input);
    const { data, error } = await supabase
      .from("it_tech_capabilities")
      .insert({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: data as TechCapability, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "기술 확보 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateTechCapability(
  id: string,
  input: TechCapabilityInput,
): Promise<FetchResult<TechCapability | null>> {
  const validationError = validateTechCapabilityInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeTechCapabilityInput(input);
    const { data, error } = await supabase
      .from("it_tech_capabilities")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    if (!data) {
      return { data: null, error: "기술 확보 항목을 찾을 수 없습니다." };
    }

    return { data: data as TechCapability, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "기술 확보 수정에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteTechCapability(
  id: string,
): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_tech_capabilities")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { error: "기술 확보 항목을 찾을 수 없습니다." };
    }

    const { error } = await supabase
      .from("it_tech_capabilities")
      .delete()
      .eq("id", id);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "기술 확보 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

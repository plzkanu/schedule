import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatSupabaseNetworkError } from "@/lib/supabase/fetch";
import {
  normalizeReviewInput,
  validateReviewInput,
} from "@/lib/review-validation";
import { sortReviewsForList } from "@/lib/review-sort";
import type { Review, ReviewFilters, ReviewInput } from "@/lib/review-types";

interface FetchResult<T> {
  data: T;
  error: string | null;
}

export async function listReviews(
  filters: ReviewFilters = {},
): Promise<FetchResult<Review[]>> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }

  try {
    const supabase = createServerClient();
    let query = supabase.from("it_reviews").select("*");

    if (filters.category) {
      query = query.eq("category", filters.category);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters.reviewer_id) {
      query = query.eq("reviewer_id", filters.reviewer_id);
    }
    if (filters.search?.trim()) {
      query = query.ilike("title", `%${filters.search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return { data: [], error: formatSupabaseNetworkError(error.message) };
    }

    return { data: sortReviewsForList((data ?? []) as Review[]), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검토 목록 조회에 실패했습니다.";
    return { data: [], error: formatSupabaseNetworkError(message) };
  }
}

export async function getReview(
  id: string,
): Promise<FetchResult<Review | null>> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("it_reviews")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: (data as Review | null) ?? null, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검토 조회에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function createReview(
  input: ReviewInput,
): Promise<FetchResult<Review | null>> {
  const validationError = validateReviewInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeReviewInput(input);
    const { data, error } = await supabase
      .from("it_reviews")
      .insert({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return { data: null, error: formatSupabaseNetworkError(error.message) };
    }

    return { data: data as Review, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검토 등록에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function updateReview(
  id: string,
  input: ReviewInput,
): Promise<FetchResult<Review | null>> {
  const validationError = validateReviewInput(input);
  if (validationError) {
    return { data: null, error: validationError };
  }

  try {
    const supabase = createServerClient();
    const payload = normalizeReviewInput(input);
    const { data, error } = await supabase
      .from("it_reviews")
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
      return { data: null, error: "검토 항목을 찾을 수 없습니다." };
    }

    return { data: data as Review, error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검토 수정에 실패했습니다.";
    return { data: null, error: formatSupabaseNetworkError(message) };
  }
}

export async function deleteReview(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = createServerClient();
    const { data: existing } = await supabase
      .from("it_reviews")
      .select("title")
      .eq("id", id)
      .maybeSingle();

    if (!existing) {
      return { error: "검토 항목을 찾을 수 없습니다." };
    }

    const { error } = await supabase.from("it_reviews").delete().eq("id", id);

    if (error) {
      return { error: formatSupabaseNetworkError(error.message) };
    }

    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "검토 삭제에 실패했습니다.";
    return { error: formatSupabaseNetworkError(message) };
  }
}

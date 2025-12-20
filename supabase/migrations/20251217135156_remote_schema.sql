drop trigger if exists "update_marketplace_controls_updated_at" on "public"."marketplace_controls";

drop trigger if exists "trigger_price_change" on "public"."marketplace_listings";

drop trigger if exists "update_scrape_runs_updated_at" on "public"."scrape_runs";

drop policy "Authenticated users can read marketplace_controls" on "public"."marketplace_controls";

drop policy "Service role can manage marketplace_controls" on "public"."marketplace_controls";

drop policy "Authenticated users can insert marketplace listings" on "public"."marketplace_listings";

drop policy "Authenticated users can view marketplace listings" on "public"."marketplace_listings";

drop policy "Service role can delete marketplace listings" on "public"."marketplace_listings";

drop policy "Service role can update marketplace listings" on "public"."marketplace_listings";

drop policy "Service role full access to marketplace listings" on "public"."marketplace_listings";

drop policy "Authenticated users can insert price history" on "public"."price_history";

drop policy "Authenticated users can view price history" on "public"."price_history";

drop policy "Service role can delete price history" on "public"."price_history";

drop policy "Service role can update price history" on "public"."price_history";

drop policy "Service role full access to price history" on "public"."price_history";

drop policy "Service role can manage scrape_runs" on "public"."scrape_runs";

drop policy "Users can read own scrape_runs" on "public"."scrape_runs";

revoke delete on table "public"."activity_feed" from "anon";

revoke insert on table "public"."activity_feed" from "anon";

revoke references on table "public"."activity_feed" from "anon";

revoke select on table "public"."activity_feed" from "anon";

revoke trigger on table "public"."activity_feed" from "anon";

revoke truncate on table "public"."activity_feed" from "anon";

revoke update on table "public"."activity_feed" from "anon";

revoke delete on table "public"."activity_feed" from "authenticated";

revoke insert on table "public"."activity_feed" from "authenticated";

revoke references on table "public"."activity_feed" from "authenticated";

revoke select on table "public"."activity_feed" from "authenticated";

revoke trigger on table "public"."activity_feed" from "authenticated";

revoke truncate on table "public"."activity_feed" from "authenticated";

revoke update on table "public"."activity_feed" from "authenticated";

revoke delete on table "public"."activity_feed" from "service_role";

revoke insert on table "public"."activity_feed" from "service_role";

revoke references on table "public"."activity_feed" from "service_role";

revoke select on table "public"."activity_feed" from "service_role";

revoke trigger on table "public"."activity_feed" from "service_role";

revoke truncate on table "public"."activity_feed" from "service_role";

revoke update on table "public"."activity_feed" from "service_role";

revoke delete on table "public"."conversion_metrics" from "anon";

revoke insert on table "public"."conversion_metrics" from "anon";

revoke references on table "public"."conversion_metrics" from "anon";

revoke select on table "public"."conversion_metrics" from "anon";

revoke trigger on table "public"."conversion_metrics" from "anon";

revoke truncate on table "public"."conversion_metrics" from "anon";

revoke update on table "public"."conversion_metrics" from "anon";

revoke delete on table "public"."conversion_metrics" from "authenticated";

revoke insert on table "public"."conversion_metrics" from "authenticated";

revoke references on table "public"."conversion_metrics" from "authenticated";

revoke select on table "public"."conversion_metrics" from "authenticated";

revoke trigger on table "public"."conversion_metrics" from "authenticated";

revoke truncate on table "public"."conversion_metrics" from "authenticated";

revoke update on table "public"."conversion_metrics" from "authenticated";

revoke delete on table "public"."conversion_metrics" from "service_role";

revoke insert on table "public"."conversion_metrics" from "service_role";

revoke references on table "public"."conversion_metrics" from "service_role";

revoke select on table "public"."conversion_metrics" from "service_role";

revoke trigger on table "public"."conversion_metrics" from "service_role";

revoke truncate on table "public"."conversion_metrics" from "service_role";

revoke update on table "public"."conversion_metrics" from "service_role";

revoke delete on table "public"."marketplace_health" from "anon";

revoke insert on table "public"."marketplace_health" from "anon";

revoke references on table "public"."marketplace_health" from "anon";

revoke select on table "public"."marketplace_health" from "anon";

revoke trigger on table "public"."marketplace_health" from "anon";

revoke truncate on table "public"."marketplace_health" from "anon";

revoke update on table "public"."marketplace_health" from "anon";

revoke delete on table "public"."marketplace_health" from "authenticated";

revoke insert on table "public"."marketplace_health" from "authenticated";

revoke references on table "public"."marketplace_health" from "authenticated";

revoke select on table "public"."marketplace_health" from "authenticated";

revoke trigger on table "public"."marketplace_health" from "authenticated";

revoke truncate on table "public"."marketplace_health" from "authenticated";

revoke update on table "public"."marketplace_health" from "authenticated";

revoke delete on table "public"."marketplace_health" from "service_role";

revoke insert on table "public"."marketplace_health" from "service_role";

revoke references on table "public"."marketplace_health" from "service_role";

revoke select on table "public"."marketplace_health" from "service_role";

revoke trigger on table "public"."marketplace_health" from "service_role";

revoke truncate on table "public"."marketplace_health" from "service_role";

revoke update on table "public"."marketplace_health" from "service_role";

revoke delete on table "public"."marketplace_listings" from "anon";

revoke insert on table "public"."marketplace_listings" from "anon";

revoke references on table "public"."marketplace_listings" from "anon";

revoke select on table "public"."marketplace_listings" from "anon";

revoke trigger on table "public"."marketplace_listings" from "anon";

revoke truncate on table "public"."marketplace_listings" from "anon";

revoke update on table "public"."marketplace_listings" from "anon";

revoke delete on table "public"."marketplace_listings" from "authenticated";

revoke insert on table "public"."marketplace_listings" from "authenticated";

revoke references on table "public"."marketplace_listings" from "authenticated";

revoke select on table "public"."marketplace_listings" from "authenticated";

revoke trigger on table "public"."marketplace_listings" from "authenticated";

revoke truncate on table "public"."marketplace_listings" from "authenticated";

revoke update on table "public"."marketplace_listings" from "authenticated";

revoke delete on table "public"."marketplace_listings" from "service_role";

revoke insert on table "public"."marketplace_listings" from "service_role";

revoke references on table "public"."marketplace_listings" from "service_role";

revoke select on table "public"."marketplace_listings" from "service_role";

revoke trigger on table "public"."marketplace_listings" from "service_role";

revoke truncate on table "public"."marketplace_listings" from "service_role";

revoke update on table "public"."marketplace_listings" from "service_role";

revoke delete on table "public"."price_history" from "anon";

revoke insert on table "public"."price_history" from "anon";

revoke references on table "public"."price_history" from "anon";

revoke select on table "public"."price_history" from "anon";

revoke trigger on table "public"."price_history" from "anon";

revoke truncate on table "public"."price_history" from "anon";

revoke update on table "public"."price_history" from "anon";

revoke delete on table "public"."price_history" from "authenticated";

revoke insert on table "public"."price_history" from "authenticated";

revoke references on table "public"."price_history" from "authenticated";

revoke select on table "public"."price_history" from "authenticated";

revoke trigger on table "public"."price_history" from "authenticated";

revoke truncate on table "public"."price_history" from "authenticated";

revoke update on table "public"."price_history" from "authenticated";

revoke delete on table "public"."price_history" from "service_role";

revoke insert on table "public"."price_history" from "service_role";

revoke references on table "public"."price_history" from "service_role";

revoke select on table "public"."price_history" from "service_role";

revoke trigger on table "public"."price_history" from "service_role";

revoke truncate on table "public"."price_history" from "service_role";

revoke update on table "public"."price_history" from "service_role";

revoke delete on table "public"."saved_search_hits" from "anon";

revoke insert on table "public"."saved_search_hits" from "anon";

revoke references on table "public"."saved_search_hits" from "anon";

revoke select on table "public"."saved_search_hits" from "anon";

revoke trigger on table "public"."saved_search_hits" from "anon";

revoke truncate on table "public"."saved_search_hits" from "anon";

revoke update on table "public"."saved_search_hits" from "anon";

revoke delete on table "public"."saved_search_hits" from "authenticated";

revoke insert on table "public"."saved_search_hits" from "authenticated";

revoke references on table "public"."saved_search_hits" from "authenticated";

revoke select on table "public"."saved_search_hits" from "authenticated";

revoke trigger on table "public"."saved_search_hits" from "authenticated";

revoke truncate on table "public"."saved_search_hits" from "authenticated";

revoke update on table "public"."saved_search_hits" from "authenticated";

revoke delete on table "public"."saved_search_hits" from "service_role";

revoke insert on table "public"."saved_search_hits" from "service_role";

revoke references on table "public"."saved_search_hits" from "service_role";

revoke select on table "public"."saved_search_hits" from "service_role";

revoke trigger on table "public"."saved_search_hits" from "service_role";

revoke truncate on table "public"."saved_search_hits" from "service_role";

revoke update on table "public"."saved_search_hits" from "service_role";

revoke delete on table "public"."saved_search_metrics" from "anon";

revoke insert on table "public"."saved_search_metrics" from "anon";

revoke references on table "public"."saved_search_metrics" from "anon";

revoke select on table "public"."saved_search_metrics" from "anon";

revoke trigger on table "public"."saved_search_metrics" from "anon";

revoke truncate on table "public"."saved_search_metrics" from "anon";

revoke update on table "public"."saved_search_metrics" from "anon";

revoke delete on table "public"."saved_search_metrics" from "authenticated";

revoke insert on table "public"."saved_search_metrics" from "authenticated";

revoke references on table "public"."saved_search_metrics" from "authenticated";

revoke select on table "public"."saved_search_metrics" from "authenticated";

revoke trigger on table "public"."saved_search_metrics" from "authenticated";

revoke truncate on table "public"."saved_search_metrics" from "authenticated";

revoke update on table "public"."saved_search_metrics" from "authenticated";

revoke delete on table "public"."saved_search_metrics" from "service_role";

revoke insert on table "public"."saved_search_metrics" from "service_role";

revoke references on table "public"."saved_search_metrics" from "service_role";

revoke select on table "public"."saved_search_metrics" from "service_role";

revoke trigger on table "public"."saved_search_metrics" from "service_role";

revoke truncate on table "public"."saved_search_metrics" from "service_role";

revoke update on table "public"."saved_search_metrics" from "service_role";

revoke delete on table "public"."saved_search_runs" from "anon";

revoke insert on table "public"."saved_search_runs" from "anon";

revoke references on table "public"."saved_search_runs" from "anon";

revoke select on table "public"."saved_search_runs" from "anon";

revoke trigger on table "public"."saved_search_runs" from "anon";

revoke truncate on table "public"."saved_search_runs" from "anon";

revoke update on table "public"."saved_search_runs" from "anon";

revoke delete on table "public"."saved_search_runs" from "authenticated";

revoke insert on table "public"."saved_search_runs" from "authenticated";

revoke references on table "public"."saved_search_runs" from "authenticated";

revoke select on table "public"."saved_search_runs" from "authenticated";

revoke trigger on table "public"."saved_search_runs" from "authenticated";

revoke truncate on table "public"."saved_search_runs" from "authenticated";

revoke update on table "public"."saved_search_runs" from "authenticated";

revoke delete on table "public"."saved_search_runs" from "service_role";

revoke insert on table "public"."saved_search_runs" from "service_role";

revoke references on table "public"."saved_search_runs" from "service_role";

revoke select on table "public"."saved_search_runs" from "service_role";

revoke trigger on table "public"."saved_search_runs" from "service_role";

revoke truncate on table "public"."saved_search_runs" from "service_role";

revoke update on table "public"."saved_search_runs" from "service_role";

revoke delete on table "public"."search_performance" from "anon";

revoke insert on table "public"."search_performance" from "anon";

revoke references on table "public"."search_performance" from "anon";

revoke select on table "public"."search_performance" from "anon";

revoke trigger on table "public"."search_performance" from "anon";

revoke truncate on table "public"."search_performance" from "anon";

revoke update on table "public"."search_performance" from "anon";

revoke delete on table "public"."search_performance" from "authenticated";

revoke insert on table "public"."search_performance" from "authenticated";

revoke references on table "public"."search_performance" from "authenticated";

revoke select on table "public"."search_performance" from "authenticated";

revoke trigger on table "public"."search_performance" from "authenticated";

revoke truncate on table "public"."search_performance" from "authenticated";

revoke update on table "public"."search_performance" from "authenticated";

revoke delete on table "public"."search_performance" from "service_role";

revoke insert on table "public"."search_performance" from "service_role";

revoke references on table "public"."search_performance" from "service_role";

revoke select on table "public"."search_performance" from "service_role";

revoke trigger on table "public"."search_performance" from "service_role";

revoke truncate on table "public"."search_performance" from "service_role";

revoke update on table "public"."search_performance" from "service_role";

alter table "public"."activity_feed" drop constraint "activity_feed_activity_type_check";

alter table "public"."activity_feed" drop constraint "activity_feed_listing_id_fkey";

alter table "public"."activity_feed" drop constraint "activity_feed_marketplace_check";

alter table "public"."activity_feed" drop constraint "activity_feed_saved_search_id_fkey";

alter table "public"."activity_feed" drop constraint "activity_feed_user_id_fkey";

alter table "public"."conversion_metrics" drop constraint "conversion_metrics_action_type_check";

alter table "public"."conversion_metrics" drop constraint "conversion_metrics_listing_id_fkey";

alter table "public"."conversion_metrics" drop constraint "conversion_metrics_marketplace_check";

alter table "public"."conversion_metrics" drop constraint "conversion_metrics_saved_search_id_fkey";

alter table "public"."conversion_metrics" drop constraint "conversion_metrics_user_id_fkey";

alter table "public"."marketplace_health" drop constraint "marketplace_health_marketplace_check";

alter table "public"."marketplace_listings" drop constraint "marketplace_listings_marketplace_check";

alter table "public"."price_history" drop constraint "price_history_listing_id_fkey";

alter table "public"."price_history" drop constraint "price_history_marketplace_check";

alter table "public"."saved_search_metrics" drop constraint "saved_search_metrics_saved_search_id_key";

alter table "public"."search_performance" drop constraint "search_performance_marketplace_check";

alter table "public"."search_performance" drop constraint "search_performance_saved_search_id_fkey";

drop function if exists "public"."cleanup_old_activity_feed"();

drop view if exists "public"."conversion_funnel";

drop view if exists "public"."marketplace_performance_comparison";

drop view if exists "public"."price_trends_summary";

drop function if exists "public"."record_price_change"();

alter table "public"."activity_feed" drop constraint "activity_feed_pkey";

alter table "public"."conversion_metrics" drop constraint "conversion_metrics_pkey";

alter table "public"."marketplace_health" drop constraint "marketplace_health_pkey";

alter table "public"."marketplace_listings" drop constraint "marketplace_listings_pkey";

alter table "public"."price_history" drop constraint "price_history_pkey";

alter table "public"."saved_search_hits" drop constraint "saved_search_hits_pkey";

alter table "public"."saved_search_metrics" drop constraint "saved_search_metrics_pkey";

alter table "public"."saved_search_runs" drop constraint "saved_search_runs_pkey";

alter table "public"."search_performance" drop constraint "search_performance_pkey";

drop index if exists "public"."activity_feed_pkey";

drop index if exists "public"."conversion_metrics_pkey";

drop index if exists "public"."idx_activity_feed_activity_type";

drop index if exists "public"."idx_activity_feed_created_at";

drop index if exists "public"."idx_activity_feed_marketplace";

drop index if exists "public"."idx_activity_feed_user_id";

drop index if exists "public"."idx_conversion_metrics_action_type";

drop index if exists "public"."idx_conversion_metrics_created_at";

drop index if exists "public"."idx_conversion_metrics_listing_id";

drop index if exists "public"."idx_conversion_metrics_marketplace";

drop index if exists "public"."idx_conversion_metrics_saved_search_id";

drop index if exists "public"."idx_conversion_metrics_user_id";

drop index if exists "public"."idx_marketplace_controls_marketplace";

drop index if exists "public"."idx_marketplace_health_marketplace";

drop index if exists "public"."idx_marketplace_health_marketplace_date";

drop index if exists "public"."idx_marketplace_health_snapshot_date";

drop index if exists "public"."idx_marketplace_listings_created_at";

drop index if exists "public"."idx_marketplace_listings_marketplace";

drop index if exists "public"."idx_marketplace_listings_marketplace_external_id";

drop index if exists "public"."idx_price_history_listing_id";

drop index if exists "public"."idx_price_history_marketplace_external_id";

drop index if exists "public"."idx_price_history_recorded_at";

drop index if exists "public"."idx_saved_search_hits_created_at";

drop index if exists "public"."idx_saved_search_hits_run_id";

drop index if exists "public"."idx_saved_search_hits_run_marketplace_external";

drop index if exists "public"."idx_saved_search_metrics_last_run_at";

drop index if exists "public"."idx_saved_search_metrics_saved_search_id";

drop index if exists "public"."idx_saved_search_runs_marketplace";

drop index if exists "public"."idx_saved_search_runs_run_started_at";

drop index if exists "public"."idx_saved_search_runs_saved_search_id";

drop index if exists "public"."idx_scrape_runs_marketplace_created_at";

drop index if exists "public"."idx_scrape_runs_success_created_at";

drop index if exists "public"."idx_scrape_runs_user_id_created_at";

drop index if exists "public"."idx_search_performance_executed_at";

drop index if exists "public"."idx_search_performance_marketplace";

drop index if exists "public"."idx_search_performance_saved_search_id";

drop index if exists "public"."idx_search_performance_success";

drop index if exists "public"."marketplace_health_pkey";

drop index if exists "public"."marketplace_listings_pkey";

drop index if exists "public"."price_history_pkey";

drop index if exists "public"."saved_search_hits_pkey";

drop index if exists "public"."saved_search_metrics_pkey";

drop index if exists "public"."saved_search_metrics_saved_search_id_key";

drop index if exists "public"."saved_search_runs_pkey";

drop index if exists "public"."search_performance_pkey";

drop index if exists "public"."marketplace_controls_pkey";

drop index if exists "public"."scrape_runs_pkey";

drop table "public"."activity_feed";

drop table "public"."conversion_metrics";

drop table "public"."marketplace_health";

drop table "public"."marketplace_listings";

drop table "public"."price_history";

drop table "public"."saved_search_hits";

drop table "public"."saved_search_metrics";

drop table "public"."saved_search_runs";

drop table "public"."search_performance";


  create table "public"."active_searches" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" text not null,
    "marketplace" text not null,
    "query" text not null,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."marketplace_settings" (
    "id" uuid not null default gen_random_uuid(),
    "marketplace" text not null,
    "enabled" boolean not null default true,
    "config" jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."worker_heartbeat" (
    "id" uuid not null default gen_random_uuid(),
    "worker_id" text not null,
    "status" text not null,
    "last_seen" timestamp with time zone not null default now(),
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "last_heartbeat" timestamp with time zone not null default now()
      );


alter table "public"."marketplace_controls" alter column "id" drop default;

alter table "public"."marketplace_controls" alter column "id" add generated always as identity;

alter table "public"."marketplace_controls" alter column "id" set data type bigint using "id"::bigint;

alter table "public"."scrape_runs" drop column "updated_at";

alter table "public"."scrape_runs" alter column "duration_ms" set not null;

alter table "public"."scrape_runs" alter column "id" drop default;

alter table "public"."scrape_runs" alter column "id" add generated always as identity;

alter table "public"."scrape_runs" alter column "id" set data type bigint using "id"::bigint;

CREATE UNIQUE INDEX active_searches_pkey ON public.active_searches USING btree (id);

CREATE INDEX idx_active_searches_active ON public.active_searches USING btree (is_active);

CREATE INDEX idx_active_searches_marketplace ON public.active_searches USING btree (marketplace);

CREATE INDEX idx_scrape_runs_created_at ON public.scrape_runs USING btree (created_at);

CREATE INDEX idx_scrape_runs_marketplace ON public.scrape_runs USING btree (marketplace);

CREATE UNIQUE INDEX marketplace_settings_pkey ON public.marketplace_settings USING btree (id);

CREATE UNIQUE INDEX worker_heartbeat_pkey ON public.worker_heartbeat USING btree (id);

CREATE UNIQUE INDEX worker_heartbeat_worker_id_uidx ON public.worker_heartbeat USING btree (worker_id);

CREATE UNIQUE INDEX worker_heartbeat_worker_id_unique ON public.worker_heartbeat USING btree (worker_id);

CREATE UNIQUE INDEX marketplace_controls_pkey ON public.marketplace_controls USING btree (id);

CREATE UNIQUE INDEX scrape_runs_pkey ON public.scrape_runs USING btree (id);

alter table "public"."active_searches" add constraint "active_searches_pkey" PRIMARY KEY using index "active_searches_pkey";

alter table "public"."marketplace_settings" add constraint "marketplace_settings_pkey" PRIMARY KEY using index "marketplace_settings_pkey";

alter table "public"."worker_heartbeat" add constraint "worker_heartbeat_pkey" PRIMARY KEY using index "worker_heartbeat_pkey";

alter table "public"."worker_heartbeat" add constraint "worker_heartbeat_worker_id_unique" UNIQUE using index "worker_heartbeat_worker_id_unique";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."active_searches" to "anon";

grant insert on table "public"."active_searches" to "anon";

grant references on table "public"."active_searches" to "anon";

grant select on table "public"."active_searches" to "anon";

grant trigger on table "public"."active_searches" to "anon";

grant truncate on table "public"."active_searches" to "anon";

grant update on table "public"."active_searches" to "anon";

grant delete on table "public"."active_searches" to "authenticated";

grant insert on table "public"."active_searches" to "authenticated";

grant references on table "public"."active_searches" to "authenticated";

grant select on table "public"."active_searches" to "authenticated";

grant trigger on table "public"."active_searches" to "authenticated";

grant truncate on table "public"."active_searches" to "authenticated";

grant update on table "public"."active_searches" to "authenticated";

grant delete on table "public"."active_searches" to "service_role";

grant insert on table "public"."active_searches" to "service_role";

grant references on table "public"."active_searches" to "service_role";

grant select on table "public"."active_searches" to "service_role";

grant trigger on table "public"."active_searches" to "service_role";

grant truncate on table "public"."active_searches" to "service_role";

grant update on table "public"."active_searches" to "service_role";

grant delete on table "public"."marketplace_settings" to "anon";

grant insert on table "public"."marketplace_settings" to "anon";

grant references on table "public"."marketplace_settings" to "anon";

grant select on table "public"."marketplace_settings" to "anon";

grant trigger on table "public"."marketplace_settings" to "anon";

grant truncate on table "public"."marketplace_settings" to "anon";

grant update on table "public"."marketplace_settings" to "anon";

grant delete on table "public"."marketplace_settings" to "authenticated";

grant insert on table "public"."marketplace_settings" to "authenticated";

grant references on table "public"."marketplace_settings" to "authenticated";

grant select on table "public"."marketplace_settings" to "authenticated";

grant trigger on table "public"."marketplace_settings" to "authenticated";

grant truncate on table "public"."marketplace_settings" to "authenticated";

grant update on table "public"."marketplace_settings" to "authenticated";

grant delete on table "public"."marketplace_settings" to "service_role";

grant insert on table "public"."marketplace_settings" to "service_role";

grant references on table "public"."marketplace_settings" to "service_role";

grant select on table "public"."marketplace_settings" to "service_role";

grant trigger on table "public"."marketplace_settings" to "service_role";

grant truncate on table "public"."marketplace_settings" to "service_role";

grant update on table "public"."marketplace_settings" to "service_role";

grant delete on table "public"."worker_heartbeat" to "anon";

grant insert on table "public"."worker_heartbeat" to "anon";

grant references on table "public"."worker_heartbeat" to "anon";

grant select on table "public"."worker_heartbeat" to "anon";

grant trigger on table "public"."worker_heartbeat" to "anon";

grant truncate on table "public"."worker_heartbeat" to "anon";

grant update on table "public"."worker_heartbeat" to "anon";

grant delete on table "public"."worker_heartbeat" to "authenticated";

grant insert on table "public"."worker_heartbeat" to "authenticated";

grant references on table "public"."worker_heartbeat" to "authenticated";

grant select on table "public"."worker_heartbeat" to "authenticated";

grant trigger on table "public"."worker_heartbeat" to "authenticated";

grant truncate on table "public"."worker_heartbeat" to "authenticated";

grant update on table "public"."worker_heartbeat" to "authenticated";

grant delete on table "public"."worker_heartbeat" to "service_role";

grant insert on table "public"."worker_heartbeat" to "service_role";

grant references on table "public"."worker_heartbeat" to "service_role";

grant select on table "public"."worker_heartbeat" to "service_role";

grant trigger on table "public"."worker_heartbeat" to "service_role";

grant truncate on table "public"."worker_heartbeat" to "service_role";

grant update on table "public"."worker_heartbeat" to "service_role";


  create policy "authenticated_read_marketplace_controls"
  on "public"."marketplace_controls"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "service_role_all_access_controls"
  on "public"."marketplace_controls"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check (true);



  create policy "authenticated_read_scrape_runs"
  on "public"."scrape_runs"
  as permissive
  for select
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "service_role_all_access_scrape_runs"
  on "public"."scrape_runs"
  as permissive
  for all
  to public
using ((auth.role() = 'service_role'::text))
with check (true);


CREATE TRIGGER trg_marketplace_controls_updated BEFORE UPDATE ON public.marketplace_controls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();



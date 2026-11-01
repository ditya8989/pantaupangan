CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"commodity_id" integer NOT NULL,
	"province_id" integer NOT NULL,
	"condition_type" text NOT NULL,
	"threshold" double precision NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"last_sent_at" timestamp with time zone,
	"last_sent_data_date" date,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alerts_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "commodities" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"unit" text NOT NULL,
	"category" text NOT NULL,
	"sort_order" integer NOT NULL,
	"source_code" text NOT NULL,
	CONSTRAINT "commodities_slug_unique" UNIQUE("slug"),
	CONSTRAINT "commodities_source_code_unique" UNIQUE("source_code")
);
--> statement-breakpoint
CREATE TABLE "fetch_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"rows_upserted" integer DEFAULT 0 NOT NULL,
	"latest_data_date" date,
	"error" text,
	"warnings" text
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"commodity_id" integer NOT NULL,
	"province_id" integer NOT NULL,
	"date" date NOT NULL,
	"price" integer NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" integer PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "provinces_code_unique" UNIQUE("code"),
	CONSTRAINT "provinces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_commodity_id_commodities_id_fk" FOREIGN KEY ("commodity_id") REFERENCES "public"."commodities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alerts_email_idx" ON "alerts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "prices_commodity_province_date_uq" ON "prices" USING btree ("commodity_id","province_id","date");--> statement-breakpoint
CREATE INDEX "prices_date_idx" ON "prices" USING btree ("date");
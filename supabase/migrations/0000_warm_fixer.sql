CREATE TYPE "public"."re_attendance_method" AS ENUM('qr_scan', 'manual');--> statement-breakpoint
CREATE TYPE "public"."re_attendance_status" AS ENUM('present', 'absent', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."re_event_participant_status" AS ENUM('invited', 'registered');--> statement-breakpoint
CREATE TYPE "public"."re_user_role" AS ENUM('tutor', 'cr', 'student');--> statement-breakpoint
CREATE TYPE "public"."re_session_type" AS ENUM('class_period', 'event');--> statement-breakpoint
CREATE TABLE "re_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text NOT NULL,
	"method" text NOT NULL,
	"device_fingerprint" text,
	"latitude" double precision,
	"longitude" double precision,
	"marked_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_class_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"class_id" uuid NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_class_roster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"reg_no" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'student' NOT NULL,
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"programme_id" uuid NOT NULL,
	"name" text NOT NULL,
	"batch_year" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "re_departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "re_event_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_programmes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"name" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"timetable_entry_id" uuid,
	"room_id" uuid,
	"session_type" text NOT NULL,
	"name" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"geofence_lat" double precision,
	"geofence_lng" double precision,
	"geofence_radius" integer DEFAULT 50 NOT NULL,
	"qr_secret" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "re_timetable_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"subject_name" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"room_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "re_announcements" ADD CONSTRAINT "re_announcements_class_id_re_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."re_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_attendance_records" ADD CONSTRAINT "re_attendance_records_session_id_re_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."re_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_class_memberships" ADD CONSTRAINT "re_class_memberships_class_id_re_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."re_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_class_roster" ADD CONSTRAINT "re_class_roster_class_id_re_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."re_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_classes" ADD CONSTRAINT "re_classes_programme_id_re_programmes_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."re_programmes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_event_participants" ADD CONSTRAINT "re_event_participants_session_id_re_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."re_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_programmes" ADD CONSTRAINT "re_programmes_department_id_re_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."re_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_rooms" ADD CONSTRAINT "re_rooms_department_id_re_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."re_departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_sessions" ADD CONSTRAINT "re_sessions_class_id_re_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."re_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_sessions" ADD CONSTRAINT "re_sessions_timetable_entry_id_re_timetable_entries_id_fk" FOREIGN KEY ("timetable_entry_id") REFERENCES "public"."re_timetable_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_sessions" ADD CONSTRAINT "re_sessions_room_id_re_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."re_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_timetable_entries" ADD CONSTRAINT "re_timetable_entries_class_id_re_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."re_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "re_timetable_entries" ADD CONSTRAINT "re_timetable_entries_room_id_re_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."re_rooms"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "re_attendance_session_student_idx" ON "re_attendance_records" USING btree ("session_id","student_id");--> statement-breakpoint
CREATE UNIQUE INDEX "re_class_membership_user_class_idx" ON "re_class_memberships" USING btree ("class_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "re_class_roster_email_idx" ON "re_class_roster" USING btree ("class_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "re_class_roster_reg_no_idx" ON "re_class_roster" USING btree ("class_id","reg_no");
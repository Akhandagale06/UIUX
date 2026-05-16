CREATE TABLE "projects" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "projects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"projectId" varchar(255) NOT NULL,
	"userInput" varchar(1000),
	"device" varchar(50),
	"createdOn" timestamp DEFAULT now() NOT NULL,
	"config" json,
	"userId" varchar(255) NOT NULL,
	CONSTRAINT "projects_projectId_unique" UNIQUE("projectId")
);
--> statement-breakpoint
DROP TABLE "project" CASCADE;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_email_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;
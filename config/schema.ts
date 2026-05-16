import { THEMES } from "@/data/Themes";
import { integer, pgTable, varchar, timestamp,jsonb, json, text } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  credits:integer().default(5)
});

export const ProjectTable=pgTable("projects",{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId:varchar({ length: 255 }).notNull().unique(),
  projectName:varchar(),
  theme: varchar(),
  userInput: varchar({ length: 1000}),
  device: varchar({ length: 50}),
  createdOn: timestamp().defaultNow().notNull(),
  config: json(),
  projectVisualDescription: text(),
  userId: varchar({ length: 255}).references(() => usersTable.email).notNull()
});

export const ScreenConfigTable=pgTable('screenConfig',{
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  projectId:varchar().references(()=> ProjectTable.projectId),
  screenId:varchar(),
  screenName:varchar(),
  purpose:varchar(),
  screenDescription:varchar(),
  code: text(),
})
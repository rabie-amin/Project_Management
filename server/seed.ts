import { db } from "./db";
import { users, projects, phases } from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(phases);
  await db.delete(projects);
  await db.delete(users);

  // Create users
  const createdUsers = await db.insert(users).values([
    {
      username: "admin",
      password: "admin123",
      email: "admin@projectflow.com",
      name: "Admin User",
      role: "admin",
    },
    {
      username: "jdoe",
      password: "password123",
      email: "john.doe@projectflow.com",
      name: "John Doe",
      role: "project_manager",
    },
    {
      username: "jsmith",
      password: "password123",
      email: "jane.smith@projectflow.com",
      name: "Jane Smith",
      role: "developer",
    },
    {
      username: "bwilson",
      password: "password123",
      email: "bob.wilson@projectflow.com",
      name: "Bob Wilson",
      role: "designer",
    },
    {
      username: "ajones",
      password: "password123",
      email: "alice.jones@projectflow.com",
      name: "Alice Jones",
      role: "team_member",
    },
  ]).returning();

  console.log(`✓ Created ${createdUsers.length} users`);

  // Create projects
  const now = new Date();
  const createdProjects = await db.insert(projects).values([
    {
      name: "Website Redesign",
      client: "TechCorp Inc",
      description: "Complete overhaul of the company website with modern UI/UX",
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 5, 30),
      status: "active",
      createdBy: createdUsers[0].id,
    },
    {
      name: "Mobile App Development",
      client: "StartupXYZ",
      description: "Native mobile app for iOS and Android platforms",
      startDate: new Date(2024, 1, 15),
      endDate: new Date(2024, 7, 15),
      status: "active",
      createdBy: createdUsers[1].id,
    },
    {
      name: "E-commerce Platform",
      client: "RetailCo",
      description: "Full-stack e-commerce solution with payment integration",
      startDate: new Date(2024, 2, 1),
      endDate: new Date(2024, 9, 31),
      status: "active",
      createdBy: createdUsers[0].id,
    },
    {
      name: "Data Analytics Dashboard",
      client: "DataCorp",
      description: "Real-time analytics dashboard for business intelligence",
      startDate: new Date(2024, 3, 1),
      endDate: new Date(2024, 8, 30),
      status: "active",
      createdBy: createdUsers[1].id,
    },
  ]).returning();

  console.log(`✓ Created ${createdProjects.length} projects`);

  // Create phases for Website Redesign
  const websitePhases = await db.insert(phases).values([
    {
      projectId: createdProjects[0].id,
      name: "Discovery & Research",
      assigneeId: createdUsers[1].id,
      status: "completed",
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 31),
      notes: "User research, competitor analysis, and requirements gathering",
      order: 1,
    },
    {
      projectId: createdProjects[0].id,
      name: "Design Phase",
      assigneeId: createdUsers[3].id,
      status: "completed",
      startDate: new Date(2024, 1, 1),
      endDate: new Date(2024, 2, 15),
      notes: "UI/UX design, wireframes, and mockups",
      order: 2,
    },
    {
      projectId: createdProjects[0].id,
      name: "Development",
      assigneeId: createdUsers[2].id,
      status: "in_progress",
      startDate: new Date(2024, 2, 16),
      endDate: new Date(2024, 5, 15),
      notes: "Frontend and backend development",
      order: 3,
    },
    {
      projectId: createdProjects[0].id,
      name: "Testing & QA",
      assigneeId: createdUsers[4].id,
      status: "pending",
      startDate: new Date(2024, 5, 16),
      endDate: new Date(2024, 5, 30),
      notes: "Quality assurance and bug fixing",
      order: 4,
    },
  ]).returning();

  // Create phases for Mobile App
  const mobilePhases = await db.insert(phases).values([
    {
      projectId: createdProjects[1].id,
      name: "Requirements Analysis",
      assigneeId: createdUsers[1].id,
      status: "completed",
      startDate: new Date(2024, 1, 15),
      endDate: new Date(2024, 2, 15),
      notes: "Define app features and technical requirements",
      order: 1,
    },
    {
      projectId: createdProjects[1].id,
      name: "UI/UX Design",
      assigneeId: createdUsers[3].id,
      status: "in_progress",
      startDate: new Date(2024, 2, 16),
      endDate: new Date(2024, 4, 15),
      notes: "Mobile app design for both platforms",
      order: 2,
    },
    {
      projectId: createdProjects[1].id,
      name: "iOS Development",
      assigneeId: createdUsers[2].id,
      status: "pending",
      startDate: new Date(2024, 4, 16),
      endDate: new Date(2024, 6, 15),
      notes: "Native iOS app development",
      order: 3,
    },
    {
      projectId: createdProjects[1].id,
      name: "Android Development",
      assigneeId: createdUsers[2].id,
      status: "pending",
      startDate: new Date(2024, 4, 16),
      endDate: new Date(2024, 6, 15),
      notes: "Native Android app development",
      order: 4,
    },
    {
      projectId: createdProjects[1].id,
      name: "App Store Deployment",
      assigneeId: createdUsers[1].id,
      status: "pending",
      startDate: new Date(2024, 6, 16),
      endDate: new Date(2024, 7, 15),
      notes: "Deploy to App Store and Google Play",
      order: 5,
    },
  ]).returning();

  // Create phases for E-commerce Platform
  const ecommercePhases = await db.insert(phases).values([
    {
      projectId: createdProjects[2].id,
      name: "Platform Planning",
      assigneeId: createdUsers[0].id,
      status: "completed",
      startDate: new Date(2024, 2, 1),
      endDate: new Date(2024, 2, 31),
      notes: "E-commerce architecture and technology stack planning",
      order: 1,
    },
    {
      projectId: createdProjects[2].id,
      name: "Backend Development",
      assigneeId: createdUsers[2].id,
      status: "in_progress",
      startDate: new Date(2024, 3, 1),
      endDate: new Date(2024, 6, 31),
      notes: "API development, database design, payment integration",
      order: 2,
    },
    {
      projectId: createdProjects[2].id,
      name: "Frontend Development",
      assigneeId: createdUsers[4].id,
      status: "delayed",
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 6, 31),
      notes: "Shopping cart, product catalog, checkout flow - delayed due to resource constraints",
      order: 3,
    },
    {
      projectId: createdProjects[2].id,
      name: "Launch & Marketing",
      assigneeId: createdUsers[1].id,
      status: "pending",
      startDate: new Date(2024, 8, 1),
      endDate: new Date(2024, 9, 31),
      notes: "Go-live preparation and marketing campaign",
      order: 4,
    },
  ]).returning();

  // Create phases for Analytics Dashboard
  const analyticsPhases = await db.insert(phases).values([
    {
      projectId: createdProjects[3].id,
      name: "Data Source Integration",
      assigneeId: createdUsers[2].id,
      status: "in_progress",
      startDate: new Date(2024, 3, 1),
      endDate: new Date(2024, 5, 30),
      notes: "Connect to various data sources and ETL processes",
      order: 1,
    },
    {
      projectId: createdProjects[3].id,
      name: "Dashboard Design",
      assigneeId: createdUsers[3].id,
      status: "in_progress",
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 6, 15),
      notes: "Data visualization and dashboard layout",
      order: 2,
    },
    {
      projectId: createdProjects[3].id,
      name: "Real-time Features",
      assigneeId: createdUsers[2].id,
      status: "pending",
      startDate: new Date(2024, 6, 16),
      endDate: new Date(2024, 8, 30),
      notes: "Implement real-time data streaming and alerts",
      order: 3,
    },
  ]).returning();

  const totalPhases = websitePhases.length + mobilePhases.length + ecommercePhases.length + analyticsPhases.length;
  console.log(`✓ Created ${totalPhases} phases`);

  console.log("\n✨ Database seeded successfully!");
  console.log(`\n📊 Summary:`);
  console.log(`   Users: ${createdUsers.length}`);
  console.log(`   Projects: ${createdProjects.length}`);
  console.log(`   Phases: ${totalPhases}`);
}

seed()
  .then(() => {
    console.log("\n✅ Seed completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  });

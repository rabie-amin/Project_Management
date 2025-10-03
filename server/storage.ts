import { 
  users, 
  projects, 
  phases, 
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type Phase,
  type InsertPhase,
  type ProjectWithPhases,
  type PhaseWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  
  // Project methods
  getProjects(): Promise<ProjectWithPhases[]>;
  getProject(id: string): Promise<ProjectWithPhases | undefined>;
  createProject(insertProject: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  
  // Phase methods
  getPhasesByProject(projectId: string): Promise<PhaseWithDetails[]>;
  createPhase(insertPhase: InsertPhase): Promise<Phase>;
  updatePhase(id: string, data: Partial<InsertPhase>): Promise<Phase | undefined>;
  deletePhase(id: string): Promise<boolean>;
  
  // Analytics methods
  getStats(): Promise<any>;
  getTimelineData(): Promise<ProjectWithPhases[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Project methods
  async getProjects(): Promise<ProjectWithPhases[]> {
    const allProjects = await db.select().from(projects);
    const allPhases = await db.select().from(phases);
    const allUsers = await db.select().from(users);

    return allProjects.map(project => ({
      ...project,
      phases: allPhases
        .filter(phase => phase.projectId === project.id)
        .map(phase => ({
          ...phase,
          assignee: allUsers.find(user => user.id === phase.assigneeId),
        })),
    })) as ProjectWithPhases[];
  }

  async getProject(id: string): Promise<ProjectWithPhases | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const projectPhases = await db.select().from(phases).where(eq(phases.projectId, id));
    const allUsers = await db.select().from(users);

    return {
      ...project,
      phases: projectPhases.map(phase => ({
        ...phase,
        assignee: allUsers.find(user => user.id === phase.assigneeId),
      })),
    } as ProjectWithPhases;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();
    return result.length > 0;
  }

  // Phase methods
  async getPhasesByProject(projectId: string): Promise<PhaseWithDetails[]> {
    const projectPhases = await db.select().from(phases).where(eq(phases.projectId, projectId));
    const allUsers = await db.select().from(users);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

    return projectPhases.map(phase => ({
      ...phase,
      project,
      assignee: allUsers.find(user => user.id === phase.assigneeId),
    }));
  }

  async createPhase(insertPhase: InsertPhase): Promise<Phase> {
    const [phase] = await db
      .insert(phases)
      .values(insertPhase)
      .returning();
    return phase;
  }

  async updatePhase(id: string, data: Partial<InsertPhase>): Promise<Phase | undefined> {
    const [phase] = await db
      .update(phases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(phases.id, id))
      .returning();
    return phase || undefined;
  }

  async deletePhase(id: string): Promise<boolean> {
    const result = await db
      .delete(phases)
      .where(eq(phases.id, id))
      .returning();
    return result.length > 0;
  }

  // Analytics methods
  async getStats(): Promise<any> {
    const allProjects = await db.select().from(projects);
    const allPhases = await db.select().from(phases);
    const allUsers = await db.select().from(users);

    const completedPhases = allPhases.filter(p => p.status === 'completed').length;
    const inProgressPhases = allPhases.filter(p => p.status === 'in_progress').length;
    const delayedPhases = allPhases.filter(p => p.status === 'delayed').length;

    return {
      totalProjects: allProjects.length,
      completedPhases,
      inProgressPhases,
      delayedPhases,
      projectsChange: "+12%",
      completedChange: "+8%",
      inProgressChange: "+3%",
      delayedChange: "+2",
      recentActivity: allPhases.slice(-5).map(phase => ({
        type: phase.status === 'completed' ? 'completed' : 'updated',
        user: 'Admin',
        action: phase.status === 'completed' ? 'completed' : 'updated',
        target: phase.name,
        project: allProjects.find(p => p.id === phase.projectId)?.name,
        timestamp: phase.updatedAt || phase.createdAt,
      })),
      teamMembers: allUsers.slice(0, 5).map(user => ({
        id: user.id,
        name: user.name,
        role: user.role,
        status: 'high',
        activePhases: allPhases.filter(p => p.assigneeId === user.id && p.status === 'in_progress').length,
      })),
    };
  }

  async getTimelineData(): Promise<ProjectWithPhases[]> {
    return this.getProjects();
  }
}

export const storage = new DatabaseStorage();

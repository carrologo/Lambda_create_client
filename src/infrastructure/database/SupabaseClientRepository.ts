import { createClient } from "@supabase/supabase-js";
import { Client } from "../../domain/entities/Client";
import { ClientRepository } from "../../domain/repositories/ClientRepository";

export class SupabaseClientRepository implements ClientRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async save(client: Client): Promise<Client> {
    const { data, error } = await this.supabase
      .from("client")
      .insert({ name: client.name, email: client.email, identification: client.identification, birth_date: client.birthdate, contact: client.contact })
      .select()
      .single();

    if (error) {
     console.error("Error inserting client:", error);
      throw new Error(error.message);
    }

    return new Client( data.name, data.email, data.identification, data.birthdate, data.contact );
  }
  async findByIdentification(identification: string): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from("client")
      .select("*")
      .eq("identification", identification)
      .single();
  
    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching client:", error);
      throw new Error(error.message);
    }
  
    return data ? new Client(data.name, data.email, data.identification, data.birthdate, data.contact) : null;
  }
  async findAll(queryParams: { name?: string; page?: number; limit?: number }): Promise<{
    clients: Client[];
    pagination: {
      page: number;
      total: number;
    };
  }> {
    const { name, page = 1, limit = 50 } = queryParams;
  
    let query = this.supabase.from("client").select("*", { count: "exact" });

    if (name) {
      query = query.ilike("name", `%${name}%`); 
    }
  
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);
  
    const { data, error, count } = await query;
  
    if (error) {
      console.error("Error fetching clients:", error);
      throw new Error("Failed to fetch clients");
    }
  
    const clients = data.map(
      (clientData: any) =>
        new Client(
          clientData.name,
          clientData.email,
          clientData.identification,
          clientData.birth_date,
          clientData.contact,
          clientData.id,
        )
    );
  
    return {
      clients,
      pagination: {
        page,
        total: count || 0,
      },
    };
  }
  
  async updatePartial(id: string, updates: Partial<Client>): Promise<Client> {
    const transformedUpdates: any = { ...updates };
    if (updates.birthdate) {
      transformedUpdates.birth_date = updates.birthdate;
      delete transformedUpdates.birthdate;
    }
  
    const { data, error } = await this.supabase
      .from("client")
      .update(transformedUpdates)
      .eq("id", id)
      .single();
  
    if (error) {
      console.error("Error updating client:", error);
      throw new Error("Failed to update client");
    }
  
    return updates as Client;
  }

  async findById(id: string): Promise<Client | null> {
    const { data, error } = await this.supabase
      .from("client")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error fetching client:", error);
      throw new Error(error.message);
    }

    return data ? new Client(data.name, data.email, data.identification, data.birthdate, data.contact) : null;
  }

}
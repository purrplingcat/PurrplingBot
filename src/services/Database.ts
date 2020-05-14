import { injectable } from "inversify";
import { createConnection, Connection, Repository, ObjectType } from "typeorm";
import { entities } from "@purrplingbot/entities";

@injectable()
export default class Database {
  private connection: Connection | null = null;

  async connect() {
    const connection = await createConnection({
      type: "sqlite",
      database: "data/storage.db",
      synchronize: true,
      entities,
    });

    connection.synchronize();

    console.log("Connection to database established!");

    return this.connection = connection;
  }

  async getConnection(): Promise<Connection> {
    if (this.connection == null) {
      return await this.connect();
    }

    return this.connection;
  }

  async getRepositoryFor<E>(entity: new() => E): Promise<Repository<E>> {
    const conn = await this.getConnection();

    return conn.getRepository<E>(entity);
  }

  async getRepository<R>(repo: ObjectType<R>): Promise<R> {
    const conn = await this.getConnection();

    return conn.getCustomRepository(repo);
  }
}

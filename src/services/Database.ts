import { injectable } from "inversify";
import { createConnection, Connection, Repository, ObjectType } from "typeorm";
import { entities } from "@purrplingbot/entities";

@injectable()
export default class Database {
  private connection: Connection | null = null;

  async connect() {
    this.connection = await createConnection({
      type: "sqlite",
      database: "data/storage.db",
      synchronize: true,
      entities,
    });

    this.connection.synchronize();

    console.log("Connection to database established!");

    return this;
  }

  getConnection(): Connection {
    if (this.connection == null) {
      throw new Error("Database connection is not created!");
    }

    return this.connection;
  }

  getRepositoryFor<E>(entity: new() => E): Repository<E> {
    return this.getConnection().getRepository<E>(entity);
  }

  getRepository<R>(repo: ObjectType<R>): R {
    return this.getConnection().getCustomRepository(repo);
  }
}

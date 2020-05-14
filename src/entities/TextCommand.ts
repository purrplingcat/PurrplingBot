import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn, OneToMany, ManyToOne, JoinTable } from "typeorm";

@Entity()
export class TextCommandAlias {
  @PrimaryColumn({unique: true})
  name: string = "";

  @ManyToOne(type => TextCommand)
  original: string = "";
}

@Entity()
export default class TextCommand  {
  @PrimaryColumn({unique: true})
  name: string = "";
  @Column({nullable: true})
  description?: string;
  @Column({nullable: true})
  usage?: string;
  @Column({default: ""})
  content: string = "";

  @OneToMany(type => TextCommandAlias, alias => alias.original)
  @JoinTable()
  aliases?: TextCommandAlias[];
}

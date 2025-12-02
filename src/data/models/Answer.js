import { DataTypes } from "sequelize";
import { config } from "dotenv"; config();

export const createAnswer = async (sequelize) => {
    const Answer = sequelize.define(
        "Answer",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            question_id: {
                type: DataTypes.INTEGER,
            },
            title: {
                type: DataTypes.TEXT,
            },
            content: {
                type: DataTypes.TEXT,
            },
            audioUrl : {
                type: DataTypes.TEXT,
            },
            level: {
                type: DataTypes.TEXT,
            },
            show: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },
            created_at: {
                type: DataTypes.STRING,
            },
            updated_at: {
                type: DataTypes.STRING,
            },
            deleted_at: {
                type: DataTypes.STRING,
            },
            user_create: {
                type: DataTypes.STRING,
            },
            user_update: {
                type: DataTypes.STRING,
            },
            user_delete: {
                type: DataTypes.STRING,
            },
        },
        {
            tableName: "Answer",
            schema: process.env.SCHEMA,
        }
    );
    return Answer;
}; 
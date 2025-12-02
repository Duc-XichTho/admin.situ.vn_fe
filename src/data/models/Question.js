import { DataTypes } from "sequelize";
import { config } from "dotenv"; config();

export const createQuestion = async (sequelize) => {
    const Question = sequelize.define(
        "Question",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            question: {
                type: DataTypes.TEXT,
            },
            category: {
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
            tableName: "Question",
            schema: process.env.SCHEMA,
        }
    );
    return Question;
}; 
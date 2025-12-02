import { DataTypes } from "sequelize";
import { config } from "dotenv"; config();

export const createReflectionQuestion = async (sequelize) => {
    const ReflectionQuestion = sequelize.define(
        "ReflectionQuestion",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            question_id: {
                type: DataTypes.INTEGER,
            },
            answer_id: {
                type: DataTypes.INTEGER,
            },
            reflection_question: {
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
            tableName: "ReflectionQuestion",
            schema: process.env.SCHEMA,
        }
    );
    return ReflectionQuestion;
}; 
import { DataTypes } from "sequelize";
import { config } from "dotenv"; config();

export const createReflectionHistory = async (sequelize) => {
    const ReflectionHistory = sequelize.define(
        "ReflectionHistory",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_email: {
                type: DataTypes.STRING,
            },
            question_history_id: {
                type: DataTypes.INTEGER,
            },
            reflection_question_id: {
                type: DataTypes.INTEGER,
            },
            user_answer: {
                type: DataTypes.TEXT,
            },
            word_count: {
                type: DataTypes.INTEGER,
            },
            score: {
                type: DataTypes.TEXT,
            },
            score_text: {
                type: DataTypes.TEXT,
            },
            feedback: {
                type: DataTypes.TEXT,
            },
            accuracy_score: {
                type: DataTypes.INTEGER,
            },
            understanding_score: {
                type: DataTypes.INTEGER,
            },
            expression_score: {
                type: DataTypes.INTEGER,
            },
            status: {
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
            tableName: "ReflectionHistory",
            schema: process.env.SCHEMA,
        }
    );
    return ReflectionHistory;
}; 
import { DataTypes } from "sequelize";
import { config } from "dotenv"; config();

export const createQuestionHistory = async (sequelize) => {
    const QuestionHistory = sequelize.define(
        "QuestionHistory",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_email: {
                type: DataTypes.STRING,
            },
            question: {
                type: DataTypes.TEXT,
            },
            answer: {
                type: DataTypes.JSONB,
            },
            answer_id: {
                type: DataTypes.INTEGER,
            },
            audioUrl : {
                type: DataTypes.TEXT,
            },
            reflection_question_id: {
                type: DataTypes.INTEGER,
            },
            score: {
                type: DataTypes.TEXT,
            },
            score_text: {
                type: DataTypes.TEXT,
            },
            status: {
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
            tableName: "QuestionHistory",
            schema: process.env.SCHEMA,
        }
    );
    return QuestionHistory;
}; 
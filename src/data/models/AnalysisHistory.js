import { DataTypes } from "sequelize";
import { config }
    from "dotenv"; config();

export const createAnalysisHistory = async (sequelize) => {
    const AnalysisHistory = sequelize.define(
        "analysisHistory",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            user_email: {
                type: DataTypes.STRING,
            },
            analysis_name: {
                type: DataTypes.STRING,
            },
            time_range_type: {
                type: DataTypes.STRING,
            },
            start_date: {
                type: DataTypes.STRING,
            },
            end_date: {
                type: DataTypes.STRING,
            },
            time_range_label: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            // Dữ liệu đầu vào
            raw_data_summary: {
                type: DataTypes.JSONB,
            },
            // Kết quả AI
            ai_analysis_result: {
                type: DataTypes.JSONB,
            },
            analysis_status: {
                type: DataTypes.STRING,
            },
            ai_model_version: {
                type: DataTypes.STRING,
                defaultValue: 'v1.0',
            },
            processing_time_ms: {
                type: DataTypes.STRING,
            },
            // Metadata
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
            tableName: "analysisHistory",
            schema: process.env.SCHEMA,
            indexes: [
                {
                    unique: true,
                    fields: ['user_email', 'time_range_type', 'start_date', 'end_date'],
                    name: 'unique_user_time_range'
                },
                {
                    fields: ['user_email'],
                    name: 'idx_analysis_user_email'
                },
                {
                    fields: ['time_range_type', 'start_date', 'end_date'],
                    name: 'idx_analysis_time_range'
                },
                {
                    fields: ['analysis_status'],
                    name: 'idx_analysis_status'
                }
            ]
        }
    );
    return AnalysisHistory;
};
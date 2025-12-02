import React, { useRef, useEffect } from 'react';
import { AgCharts } from 'ag-charts-community';

// Component để render một chart
const ChartContainer = ({ table, index }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const transformTableToChartData = (table) => {
    if (!table.data || Object.keys(table.data).length === 0) {
      return [];
    }

    return Object.entries(table.data)
      .map(([key, value]) => ({
        period: key,
        value: parseFloat(value) || 0,
        valueStr: value
      }))
      .filter(item => item.value > 0); // Filter out zero values
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chartData = transformTableToChartData(table);

    if (chartData.length === 0) {
      return;
    }

        const options = {
      container: chartRef.current,
      data: chartData,
      title: {
        text: table.name || 'Bảng thông số',
        fontSize: 14,
        fontWeight: 'bold',
      },
      series: [
        {
          type: 'line',
          xKey: 'period',
          yKey: 'value',
          yName: table.name || 'Giá trị',
          stroke: '#1890ff',
          strokeWidth: 2,
          marker: {
            enabled: true,
            size: 6,
            fill: '#1890ff',
            stroke: '#ffffff',
            strokeWidth: 1,
          },
          tooltip: {
            renderer: ({ datum }) => ({
              content: `${datum.period}: ${datum.valueStr}`,
            }),
          },
        },
      ],
      axes: [
        {
          type: 'category',
          position: 'bottom',
          label: {
            fontSize: 10,
          },
        },
        {
          type: 'number',
          position: 'left',
          label: {
            fontSize: 10,
            formatter: ({ value }) => {
              return new Intl.NumberFormat('vi-VN').format(value);
            },
          },
        },
      ],
      legend: {
        enabled: false,
      },
      background: {
        fill: '#ffffff',
      },
      padding: {
        top: 15,
        right: 15,
        bottom: 30,
        left: 50,
      },
    };

    chartInstanceRef.current = AgCharts.create(options);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [table]);

  const chartData = transformTableToChartData(table);

  if (chartData.length === 0) {
    return (
      <div style={{
        padding: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        border: '1px solid #e8e8e8',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
            {table.name || `Bảng ${index + 1}`}
          </h5>
          <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>
            Chưa có dữ liệu
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '6px',
      border: '1px solid #e8e8e8',
      overflow: 'hidden',
      height: '200px'
    }}>
      <div
        ref={chartRef}
        style={{
          height: '100%',
          width: '100%'
        }}
      />
    </div>
  );
};

// Component chính để render overview charts
const ReportOverviewCharts = ({ overviewData }) => {
  if (!overviewData || !overviewData.tables || !Array.isArray(overviewData.tables) || overviewData.tables.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
      }}>
        {overviewData.tables.map((table, index) => (
          <ChartContainer
            key={table.id || index}
            table={table}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default ReportOverviewCharts;

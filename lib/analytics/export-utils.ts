interface ExportData {
  title: string;
  data: any[];
  type: 'table' | 'chart' | 'metric';
  format?: {
    columns?: string[];
    headers?: Record<string, string>;
  };
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  dateRange?: string;
  sections: ExportData[];
}

/**
 * Export analytics data to CSV format
 */
export function exportToCSV(options: ExportOptions): void {
  let csvContent = '';
  
  // Add header
  csvContent += `${options.title}\n`;
  if (options.subtitle) {
    csvContent += `${options.subtitle}\n`;
  }
  if (options.dateRange) {
    csvContent += `Date Range: ${options.dateRange}\n`;
  }
  csvContent += `Generated: ${new Date().toLocaleString('de-DE')}\n\n`;

  // Process each section
  options.sections.forEach((section, index) => {
    csvContent += `${section.title}\n`;
    
    if (section.type === 'table' && section.data.length > 0) {
      // Get headers
      const headers = section.format?.columns || Object.keys(section.data[0]);
      const headerLabels = headers.map(key => 
        section.format?.headers?.[key] || key
      );
      
      csvContent += headerLabels.join(',') + '\n';
      
      // Add data rows
      section.data.forEach(row => {
        const values = headers.map(key => {
          const value = row[key];
          // Handle commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csvContent += values.join(',') + '\n';
      });
    } else if (section.type === 'metric') {
      // Handle single metrics
      section.data.forEach(metric => {
        csvContent += `${metric.label},${metric.value}\n`;
      });
    }
    
    csvContent += '\n';
  });

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FluxAO-Analytics-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Export analytics data to PDF format
 * Note: This is a basic implementation. In production, you might want to use
 * libraries like jsPDF or Puppeteer for more advanced PDF generation.
 */
export async function exportToPDF(options: ExportOptions): Promise<void> {
  // This would require additional PDF generation library
  // For now, we'll create a formatted HTML version that can be printed to PDF
  
  const htmlContent = generateHTMLReport(options);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}

function generateHTMLReport(options: ExportOptions): string {
  const currentDate = new Date().toLocaleString('de-DE');
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${options.title}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333;
        }
        .header { 
            border-bottom: 2px solid #3b82f6; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .header h1 { 
            color: #1f2937; 
            margin: 0 0 10px 0; 
        }
        .header p { 
            margin: 5px 0; 
            color: #6b7280; 
        }
        .section { 
            margin: 30px 0; 
            page-break-inside: avoid; 
        }
        .section h2 { 
            color: #1f2937; 
            border-left: 4px solid #3b82f6; 
            padding-left: 15px; 
            margin-bottom: 15px; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
        }
        th, td { 
            border: 1px solid #e5e7eb; 
            padding: 8px 12px; 
            text-align: left; 
        }
        th { 
            background-color: #f9fafb; 
            font-weight: 600; 
        }
        .metric-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 15px 0; 
        }
        .metric-card { 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 15px; 
            background-color: #f9fafb; 
        }
        .metric-label { 
            font-size: 14px; 
            color: #6b7280; 
            margin-bottom: 5px; 
        }
        .metric-value { 
            font-size: 24px; 
            font-weight: 700; 
            color: #1f2937; 
        }
        @media print {
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${options.title}</h1>
        ${options.subtitle ? `<p><strong>${options.subtitle}</strong></p>` : ''}
        ${options.dateRange ? `<p>Zeitraum: ${options.dateRange}</p>` : ''}
        <p>Generiert am: ${currentDate}</p>
    </div>
`;

  options.sections.forEach(section => {
    html += `<div class="section">`;
    html += `<h2>${section.title}</h2>`;
    
    if (section.type === 'table' && section.data.length > 0) {
      const headers = section.format?.columns || Object.keys(section.data[0]);
      const headerLabels = headers.map(key => 
        section.format?.headers?.[key] || key
      );
      
      html += `<table>`;
      html += `<thead><tr>`;
      headerLabels.forEach(header => {
        html += `<th>${header}</th>`;
      });
      html += `</tr></thead>`;
      html += `<tbody>`;
      
      section.data.forEach(row => {
        html += `<tr>`;
        headers.forEach(key => {
          html += `<td>${row[key] || ''}</td>`;
        });
        html += `</tr>`;
      });
      
      html += `</tbody></table>`;
    } else if (section.type === 'metric') {
      html += `<div class="metric-grid">`;
      section.data.forEach(metric => {
        html += `
          <div class="metric-card">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
          </div>
        `;
      });
      html += `</div>`;
    }
    
    html += `</div>`;
  });

  html += `
</body>
</html>`;

  return html;
}

/**
 * Prepare analytics data for export
 */
export function prepareAnalyticsExport(analyticsData: any): ExportOptions {
  const now = new Date();
  const dateRange = `${now.toLocaleDateString('de-DE')} - ${now.toLocaleDateString('de-DE')}`;
  
  return {
    title: 'FluxAO Analytics Report',
    subtitle: 'Comprehensive Website Analytics and Performance Metrics',
    dateRange,
    sections: [
      {
        title: 'Key Metrics Overview',
        type: 'metric',
        data: [
          { label: 'Total Page Views', value: '45,123' },
          { label: 'Unique Visitors', value: '12,456' },
          { label: 'Bounce Rate', value: '42.3%' },
          { label: 'Average Session Duration', value: '3m 24s' },
          { label: 'Conversion Rate', value: '3.2%' },
          { label: 'Revenue (Month)', value: '€15,678' },
        ],
      },
      {
        title: 'Top Performing Articles',
        type: 'table',
        data: [
          {
            title: 'KI Revolution: Was 2024 bringt',
            views: '15,432',
            engagement: '92%',
            shares: '234',
            comments: '89',
          },
          {
            title: 'Startup Trends Deutschland',
            views: '12,876',
            engagement: '87%',
            shares: '198',
            comments: '156',
          },
          {
            title: 'Tech Investment Guide',
            views: '9,543',
            engagement: '78%',
            shares: '145',
            comments: '67',
          },
        ],
        format: {
          columns: ['title', 'views', 'engagement', 'shares', 'comments'],
          headers: {
            title: 'Article Title',
            views: 'Page Views',
            engagement: 'Engagement Rate',
            shares: 'Social Shares',
            comments: 'Comments',
          },
        },
      },
      {
        title: 'Traffic Sources',
        type: 'table',
        data: [
          { source: 'Google Search', visitors: '8,234', percentage: '45.2%' },
          { source: 'Direct Traffic', visitors: '4,567', percentage: '25.1%' },
          { source: 'Social Media', visitors: '3,123', percentage: '17.2%' },
          { source: 'Email Newsletter', visitors: '1,876', percentage: '10.3%' },
          { source: 'Other', visitors: '401', percentage: '2.2%' },
        ],
        format: {
          columns: ['source', 'visitors', 'percentage'],
          headers: {
            source: 'Traffic Source',
            visitors: 'Visitors',
            percentage: 'Percentage',
          },
        },
      },
      {
        title: 'Revenue Breakdown',
        type: 'table',
        data: [
          { category: 'Subscriptions', amount: '€8,234', percentage: '52.5%' },
          { category: 'Premium Content', amount: '€4,567', percentage: '29.1%' },
          { category: 'Advertisements', amount: '€2,123', percentage: '13.5%' },
          { category: 'Donations', amount: '€754', percentage: '4.8%' },
        ],
        format: {
          columns: ['category', 'amount', 'percentage'],
          headers: {
            category: 'Revenue Category',
            amount: 'Amount',
            percentage: 'Percentage',
          },
        },
      },
    ],
  };
}

/**
 * Export individual chart data
 */
export function exportChartData(chartData: any[], chartTitle: string, format: 'csv' | 'json' = 'csv'): void {
  if (format === 'csv') {
    exportToCSV({
      title: `FluxAO Analytics - ${chartTitle}`,
      sections: [
        {
          title: chartTitle,
          type: 'table',
          data: chartData,
        },
      ],
    });
  } else if (format === 'json') {
    const jsonData = {
      title: chartTitle,
      exportDate: new Date().toISOString(),
      data: chartData,
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json' 
    });
    
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${chartTitle}-${Date.now()}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}
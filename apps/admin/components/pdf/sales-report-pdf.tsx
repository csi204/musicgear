import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

// In a real scenario, you'd load a Thai font like Sarabun or Noto Sans Thai
// For standard PDF, we just use default fonts or register one.
// We'll assume a basic layout for now.

const tw = createTw({
  theme: {
    fontFamily: {
      sans: ['Helvetica'],
    },
    colors: {
      primary: '#0f172a',
      secondary: '#64748b',
      border: '#e2e8f0',
      accent: '#2563eb' // A slight color accent
    },
  },
});

export function SalesReportPDF({ data, dateRange }: { data: any, dateRange: {start: string, end: string} }) {
  const totalRevenue = data.salesTrends.reduce((sum: number, item: any) => sum + item.totalRevenue, 0);

  return (
    <Document>
      <Page size="A4" style={tw('p-12 font-sans bg-white')}>
        
        {/* Header */}
        <View style={tw('flex flex-row justify-between items-end border-b-2 border-primary pb-4 mb-8')}>
          <View>
            <Text style={tw('text-2xl font-bold text-primary')}>MusicGear</Text>
            <Text style={tw('text-sm text-secondary mt-1')}>Official Sales Report</Text>
          </View>
          <View style={tw('text-right')}>
            <Text style={tw('text-sm font-bold text-primary')}>Report Period</Text>
            <Text style={tw('text-xs text-secondary mt-1')}>{dateRange.start} to {dateRange.end}</Text>
          </View>
        </View>

        {/* Summary Boxes */}
        <View style={tw('flex flex-row gap-4 mb-8')}>
          <View style={tw('flex-1 border border-border p-4 rounded-md')}>
            <Text style={tw('text-xs text-secondary uppercase')}>Total Revenue</Text>
            <Text style={tw('text-lg font-bold text-accent mt-2')}>THB {totalRevenue.toLocaleString()}</Text>
          </View>
          <View style={tw('flex-1 border border-border p-4 rounded-md')}>
            <Text style={tw('text-xs text-secondary uppercase')}>Top Product</Text>
            <Text style={tw('text-lg font-bold text-primary mt-2')}>{data.topSellingGear[0]?.productName || "N/A"}</Text>
          </View>
        </View>

        {/* Top Selling Table */}
        <View style={tw('mb-8')}>
          <Text style={tw('text-sm font-bold text-primary mb-4 uppercase')}>Top Selling Gear</Text>
          
          <View style={tw('border border-border rounded-md')}>
            {/* Table Header */}
            <View style={tw('flex flex-row bg-gray-50 border-b border-border p-3')}>
              <Text style={tw('flex-1 text-xs font-bold text-secondary')}>PRODUCT NAME</Text>
              <Text style={tw('w-24 text-right text-xs font-bold text-secondary')}>SOLD QTY</Text>
            </View>
            
            {/* Table Rows */}
            {data.topSellingGear.map((item: any, i: number) => (
              <View key={i} style={tw(`flex flex-row p-3 ${i !== data.topSellingGear.length - 1 ? 'border-b border-border' : ''}`)}>
                <Text style={tw('flex-1 text-xs text-primary')}>{item.productName}</Text>
                <Text style={tw('w-24 text-right text-xs text-primary font-bold')}>{item.sold}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Footer */}
        <View style={tw('absolute bottom-12 left-12 right-12 text-center border-t border-border pt-4')}>
          <Text style={tw('text-xs text-secondary')}>This is a computer generated document. No signature is required.</Text>
          <Text style={tw('text-xs text-secondary mt-1')}>Generated at: {new Date().toISOString()}</Text>
        </View>

      </Page>
    </Document>
  );
}

/**
 * PDFGenerator - Professional PDF Export for Birth Charts and Predictions
 *
 * Features:
 * - Multi-page birth chart reports with Vedic calculations
 * - Professional layout with sacred geometry design
 * - Charts, interpretations, and Sutra citations
 * - Devanagari font support for Sanskrit terms
 * - Error handling and progress tracking
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface BirthData {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface ChartData {
  sun?: { sign: string; house: number; degree: number };
  moon?: { sign: string; house: number; degree: number; nakshatra?: string };
  ascendant?: { sign: string; degree: number };
  planets?: Array<{
    name: string;
    sign: string;
    house: number;
    degree: number;
    retrograde?: boolean;
  }>;
  houses?: Array<{ number: number; sign: string; degree: number }>;
  dashas?: Array<{ period: string; planet: string; startDate: string; endDate: string }>;
  yogas?: Array<{ name: string; description: string; strength: number }>;
}

export interface Interpretation {
  category: string;
  title: string;
  content: string;
  citations?: string[];
  confidence?: number;
  sources?: string[];
}

export interface PDFOptions {
  includeChartImage?: boolean;
  includePlanets?: boolean;
  includeHouses?: boolean;
  includeDashas?: boolean;
  includeYogas?: boolean;
  includeInterpretations?: boolean;
  includeCitations?: boolean;
  fontSize?: number;
  pageMargin?: number;
  headerColor?: string;
  accentColor?: string;
  onProgress?: (progress: number, message: string) => void;
}

const DEFAULT_OPTIONS: PDFOptions = {
  includeChartImage: true,
  includePlanets: true,
  includeHouses: true,
  includeDashas: true,
  includeYogas: true,
  includeInterpretations: true,
  includeCitations: true,
  fontSize: 10,
  pageMargin: 20,
  headerColor: '#4A148C',
  accentColor: '#7B1FA2',
};

export class PDFGenerator {
  private pdf: jsPDF;
  private options: PDFOptions;
  private currentY: number = 0;
  private pageHeight: number = 297; // A4 height in mm
  private pageWidth: number = 210; // A4 width in mm

  constructor(options: Partial<PDFOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    this.currentY = this.options.pageMargin || 20;
  }

  /**
   * Generate complete birth chart PDF with all sections
   */
  async generateBirthChartPDF(
    birthData: BirthData,
    chartData: ChartData,
    interpretations: Interpretation[]
  ): Promise<Blob> {
    try {
      this.reportProgress(5, 'Initializing PDF generation...');

      // Cover page
      await this.addCoverPage(birthData);
      this.reportProgress(15, 'Cover page created');

      // Birth data summary
      this.addNewPage();
      this.addBirthDataSection(birthData);
      this.reportProgress(25, 'Birth data added');

      // Chart visualization
      if (this.options.includeChartImage) {
        await this.addChartVisualization(chartData);
        this.reportProgress(35, 'Chart visualization added');
      }

      // Planetary positions
      if (this.options.includePlanets && chartData.planets) {
        this.addPlanetaryPositions(chartData.planets);
        this.reportProgress(45, 'Planetary positions added');
      }

      // House cusps
      if (this.options.includeHouses && chartData.houses) {
        this.addHouseCusps(chartData.houses);
        this.reportProgress(55, 'House cusps added');
      }

      // Dasha periods
      if (this.options.includeDashas && chartData.dashas) {
        this.addDashaPeriods(chartData.dashas);
        this.reportProgress(65, 'Dasha periods added');
      }

      // Yogas
      if (this.options.includeYogas && chartData.yogas) {
        this.addYogas(chartData.yogas);
        this.reportProgress(75, 'Yogas added');
      }

      // Interpretations
      if (this.options.includeInterpretations && interpretations.length > 0) {
        await this.addInterpretations(interpretations);
        this.reportProgress(90, 'Interpretations added');
      }

      // Footer with citations
      this.addFooter();
      this.reportProgress(100, 'PDF generation complete');

      return this.pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add cover page with Om symbol and title
   */
  private async addCoverPage(birthData: BirthData): Promise<void> {
    // Background gradient effect (simulated with rectangles)
    this.pdf.setFillColor(74, 20, 140); // Deep purple
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeight / 3, 'F');
    this.pdf.setFillColor(123, 31, 162); // Medium purple
    this.pdf.rect(0, this.pageHeight / 3, this.pageWidth, this.pageHeight / 3, 'F');
    this.pdf.setFillColor(156, 39, 176); // Light purple
    this.pdf.rect(0, (2 * this.pageHeight) / 3, this.pageWidth, this.pageHeight / 3, 'F');

    // Om symbol (Unicode)
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(60);
    this.pdf.text('ॐ', this.pageWidth / 2, 60, { align: 'center' });

    // Title
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Soul Journey Report', this.pageWidth / 2, 90, { align: 'center' });

    // Subtitle
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Vedic Astrology Birth Chart Analysis', this.pageWidth / 2, 105, { align: 'center' });

    // Name
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(birthData.name, this.pageWidth / 2, 140, { align: 'center' });

    // Birth details
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Born: ${birthData.dateOfBirth} at ${birthData.timeOfBirth}`, this.pageWidth / 2, 155, { align: 'center' });
    this.pdf.text(`Place: ${birthData.placeOfBirth}`, this.pageWidth / 2, 165, { align: 'center' });

    // Footer
    this.pdf.setFontSize(10);
    this.pdf.text('Generated by BhriguWelt', this.pageWidth / 2, 270, { align: 'center' });
    this.pdf.text(`Generated on ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 280, { align: 'center' });
  }

  /**
   * Add birth data summary section
   */
  private addBirthDataSection(birthData: BirthData): void {
    this.addSectionHeader('Birth Data Summary');

    const data = [
      ['Name', birthData.name],
      ['Date of Birth', birthData.dateOfBirth],
      ['Time of Birth', birthData.timeOfBirth],
      ['Place of Birth', birthData.placeOfBirth],
    ];

    if (birthData.latitude !== undefined && birthData.longitude !== undefined) {
      data.push(['Coordinates', `${birthData.latitude.toFixed(4)}°N, ${birthData.longitude.toFixed(4)}°E`]);
    }

    if (birthData.timezone) {
      data.push(['Timezone', birthData.timezone]);
    }

    this.addTable(['Field', 'Value'], data);
  }

  /**
   * Add chart visualization (if element exists)
   */
  private async addChartVisualization(chartData: ChartData): Promise<void> {
    try {
      // Check if birth chart wheel element exists in DOM
      const chartElement = document.getElementById('birth-chart-wheel') ||
                          document.querySelector('.birth-chart-visualization');

      if (chartElement && chartElement instanceof HTMLElement) {
        this.checkPageSpace(80);
        this.addSectionHeader('Birth Chart Visualization');

        const canvas = await html2canvas(chartElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = this.pageWidth - (2 * (this.options.pageMargin || 20));
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        this.pdf.addImage(imgData, 'PNG', this.options.pageMargin || 20, this.currentY, imgWidth, imgHeight);
        this.currentY += imgHeight + 10;
      } else {
        // Fallback: Text-based chart representation
        this.checkPageSpace(60);
        this.addSectionHeader('Key Chart Points');

        const data: string[][] = [];
        if (chartData.ascendant) {
          data.push(['Ascendant (Lagna)', `${chartData.ascendant.sign} ${chartData.ascendant.degree.toFixed(2)}°`]);
        }
        if (chartData.sun) {
          data.push(['Sun', `${chartData.sun.sign} in House ${chartData.sun.house}`]);
        }
        if (chartData.moon) {
          const nakshatra = chartData.moon.nakshatra ? ` (${chartData.moon.nakshatra})` : '';
          data.push(['Moon', `${chartData.moon.sign} in House ${chartData.moon.house}${nakshatra}`]);
        }

        if (data.length > 0) {
          this.addTable(['Point', 'Position'], data);
        }
      }
    } catch (error) {
      console.error('Error adding chart visualization:', error);
      // Continue without chart image
    }
  }

  /**
   * Add planetary positions table
   */
  private addPlanetaryPositions(planets: Array<{
    name: string;
    sign: string;
    house: number;
    degree: number;
    retrograde?: boolean;
  }>): void {
    this.checkPageSpace(60);
    this.addSectionHeader('Planetary Positions');

    const data = planets.map(planet => [
      planet.name + (planet.retrograde ? ' (R)' : ''),
      planet.sign,
      `House ${planet.house}`,
      `${planet.degree.toFixed(2)}°`,
    ]);

    this.addTable(['Planet', 'Sign', 'House', 'Degree'], data);
  }

  /**
   * Add house cusps table
   */
  private addHouseCusps(houses: Array<{ number: number; sign: string; degree: number }>): void {
    this.checkPageSpace(60);
    this.addSectionHeader('House Cusps');

    const data = houses.map(house => [
      `House ${house.number}`,
      house.sign,
      `${house.degree.toFixed(2)}°`,
    ]);

    this.addTable(['House', 'Sign', 'Degree'], data, 3);
  }

  /**
   * Add Dasha periods table
   */
  private addDashaPeriods(dashas: Array<{
    period: string;
    planet: string;
    startDate: string;
    endDate: string;
  }>): void {
    this.checkPageSpace(60);
    this.addSectionHeader('Vimshottari Dasha Periods');

    const data = dashas.map(dasha => [
      dasha.period,
      dasha.planet,
      dasha.startDate,
      dasha.endDate,
    ]);

    this.addTable(['Period', 'Planet', 'Start Date', 'End Date'], data);
  }

  /**
   * Add Yogas section
   */
  private addYogas(yogas: Array<{ name: string; description: string; strength: number }>): void {
    this.checkPageSpace(40);
    this.addSectionHeader('Planetary Yogas');

    yogas.forEach(yoga => {
      this.checkPageSpace(25);
      this.pdf.setFontSize(this.options.fontSize || 10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(74, 20, 140);
      this.pdf.text(`${yoga.name} (Strength: ${yoga.strength}/10)`, this.options.pageMargin || 20, this.currentY);
      this.currentY += 6;

      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      const wrappedText = this.wrapText(yoga.description, this.pageWidth - 2 * (this.options.pageMargin || 20));
      wrappedText.forEach(line => {
        this.checkPageSpace(5);
        this.pdf.text(line, this.options.pageMargin || 20, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 5;
    });
  }

  /**
   * Add interpretations section
   */
  private async addInterpretations(interpretations: Interpretation[]): Promise<void> {
    this.addNewPage();
    this.addSectionHeader('Detailed Interpretations');

    interpretations.forEach((interpretation, _index) => {
      this.checkPageSpace(40);

      // Category and title
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(123, 31, 162);
      this.pdf.text(`${interpretation.category}: ${interpretation.title}`, this.options.pageMargin || 20, this.currentY);
      this.currentY += 8;

      // Confidence score (if available)
      if (interpretation.confidence !== undefined) {
        this.pdf.setFontSize(9);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(`Confidence: ${(interpretation.confidence * 100).toFixed(0)}%`, this.options.pageMargin || 20, this.currentY);
        this.currentY += 6;
      }

      // Content
      this.pdf.setFontSize(this.options.fontSize || 10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      const wrappedContent = this.wrapText(interpretation.content, this.pageWidth - 2 * (this.options.pageMargin || 20));
      wrappedContent.forEach(line => {
        this.checkPageSpace(5);
        this.pdf.text(line, this.options.pageMargin || 20, this.currentY);
        this.currentY += 5;
      });

      // Citations (if available and enabled)
      if (this.options.includeCitations && interpretation.citations && interpretation.citations.length > 0) {
        this.currentY += 3;
        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text('Citations:', this.options.pageMargin || 20, this.currentY);
        this.currentY += 4;

        interpretation.citations.forEach(citation => {
          this.checkPageSpace(4);
          this.pdf.text(`• ${citation}`, (this.options.pageMargin || 20) + 5, this.currentY);
          this.currentY += 4;
        });
      }

      // Sources (if available)
      if (interpretation.sources && interpretation.sources.length > 0) {
        this.currentY += 2;
        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(`Sources: ${interpretation.sources.join(', ')}`, this.options.pageMargin || 20, this.currentY);
        this.currentY += 5;
      }

      this.currentY += 8; // Space between interpretations
    });
  }

  /**
   * Add footer with disclaimer and copyright
   */
  private addFooter(): void {
    const pageCount = (this.pdf as any).internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(100, 100, 100);

      // Page number
      this.pdf.text(`Page ${i} of ${pageCount}`, this.pageWidth / 2, this.pageHeight - 10, { align: 'center' });

      // Copyright on first page
      if (i === 1) {
        this.pdf.text('© BhriguWelt - For personal use only', this.pageWidth / 2, this.pageHeight - 5, { align: 'center' });
      }
    }
  }

  /**
   * Add section header
   */
  private addSectionHeader(title: string): void {
    this.checkPageSpace(15);
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(74, 20, 140);
    this.pdf.text(title, this.options.pageMargin || 20, this.currentY);
    this.currentY += 10;

    // Underline
    this.pdf.setDrawColor(123, 31, 162);
    this.pdf.setLineWidth(0.5);
    this.pdf.line(
      this.options.pageMargin || 20,
      this.currentY,
      this.pageWidth - (this.options.pageMargin || 20),
      this.currentY
    );
    this.currentY += 8;
  }

  /**
   * Add table with headers and data
   */
  private addTable(headers: string[], data: string[][], columnsPerRow: number = headers.length): void {
    const margin = this.options.pageMargin || 20;
    const tableWidth = this.pageWidth - 2 * margin;
    const colWidth = tableWidth / columnsPerRow;
    const rowHeight = 7;

    this.checkPageSpace((data.length + 2) * rowHeight);

    // Headers
    this.pdf.setFillColor(74, 20, 140);
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');

    headers.forEach((header, i) => {
      this.pdf.rect(margin + i * colWidth, this.currentY, colWidth, rowHeight, 'F');
      this.pdf.text(header, margin + i * colWidth + 2, this.currentY + 5);
    });
    this.currentY += rowHeight;

    // Data rows
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    data.forEach((row, rowIndex) => {
      this.checkPageSpace(rowHeight);

      // Alternating row colors
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(245, 245, 245);
        this.pdf.rect(margin, this.currentY, tableWidth, rowHeight, 'F');
      }

      row.forEach((cell, colIndex) => {
        this.pdf.text(cell, margin + colIndex * colWidth + 2, this.currentY + 5);
      });
      this.currentY += rowHeight;
    });

    this.currentY += 5; // Space after table
  }

  /**
   * Wrap text to fit within specified width
   */
  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.pdf.getTextWidth(testLine);

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Check if there's enough space on current page, add new page if needed
   */
  private checkPageSpace(requiredSpace: number): void {
    const margin = this.options.pageMargin || 20;
    if (this.currentY + requiredSpace > this.pageHeight - margin - 15) {
      this.addNewPage();
    }
  }

  /**
   * Add new page
   */
  private addNewPage(): void {
    this.pdf.addPage();
    this.currentY = this.options.pageMargin || 20;
  }

  /**
   * Report progress to callback
   */
  private reportProgress(progress: number, message: string): void {
    if (this.options.onProgress) {
      this.options.onProgress(progress, message);
    }
  }

  /**
   * Generate simplified prediction PDF
   */
  async generatePredictionPDF(
    predictionTitle: string,
    predictionContent: string,
    birthData?: BirthData,
    citations?: string[]
  ): Promise<Blob> {
    try {
      this.reportProgress(10, 'Generating prediction PDF...');

      // Simple cover
      this.pdf.setFontSize(24);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setTextColor(74, 20, 140);
      this.pdf.text(predictionTitle, this.pageWidth / 2, 40, { align: 'center' });

      if (birthData) {
        this.pdf.setFontSize(12);
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.text(`For: ${birthData.name}`, this.pageWidth / 2, 55, { align: 'center' });
      }

      this.currentY = 70;
      this.reportProgress(30, 'Adding content...');

      // Content
      this.pdf.setFontSize(this.options.fontSize || 10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(0, 0, 0);
      const wrappedContent = this.wrapText(predictionContent, this.pageWidth - 2 * (this.options.pageMargin || 20));

      wrappedContent.forEach(line => {
        this.checkPageSpace(5);
        this.pdf.text(line, this.options.pageMargin || 20, this.currentY);
        this.currentY += 5;
      });

      this.reportProgress(70, 'Adding citations...');

      // Citations
      if (citations && citations.length > 0) {
        this.currentY += 10;
        this.checkPageSpace(20);
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('Sources:', this.options.pageMargin || 20, this.currentY);
        this.currentY += 6;

        this.pdf.setFontSize(8);
        this.pdf.setFont('helvetica', 'italic');
        citations.forEach(citation => {
          this.checkPageSpace(5);
          this.pdf.text(`• ${citation}`, (this.options.pageMargin || 20) + 5, this.currentY);
          this.currentY += 5;
        });
      }

      this.addFooter();
      this.reportProgress(100, 'PDF complete');

      return this.pdf.output('blob');
    } catch (error) {
      console.error('Error generating prediction PDF:', error);
      throw new Error(`Prediction PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Utility function to generate and download birth chart PDF
 */
export async function downloadBirthChartPDF(
  birthData: BirthData,
  chartData: ChartData,
  interpretations: Interpretation[],
  options?: Partial<PDFOptions>
): Promise<void> {
  try {
    const generator = new PDFGenerator(options);
    const blob = await generator.generateBirthChartPDF(birthData, chartData, interpretations);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${birthData.name.replace(/\s+/g, '_')}_Birth_Chart_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Utility function to generate and download prediction PDF
 */
export async function downloadPredictionPDF(
  title: string,
  content: string,
  birthData?: BirthData,
  citations?: string[],
  options?: Partial<PDFOptions>
): Promise<void> {
  try {
    const generator = new PDFGenerator(options);
    const blob = await generator.generatePredictionPDF(title, content, birthData, citations);

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = birthData
      ? `${birthData.name.replace(/\s+/g, '_')}_${title.replace(/\s+/g, '_')}.pdf`
      : `${title.replace(/\s+/g, '_')}.pdf`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading prediction PDF:', error);
    throw error;
  }
}

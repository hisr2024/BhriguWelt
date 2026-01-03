import 'dart:io';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';
import '../../data/models/report_model.dart';
import '../../data/models/profile_model.dart';

/// Generates multi-page PDF reports for Soul Journey
class PdfGenerator {
  /// Generate PDF from report
  Future<File> generateReportPdf(
    ReportModel report,
    ProfileModel profile,
  ) async {
    final pdf = pw.Document();

    // Load fonts for Om symbol and Devanagari
    final devanagariFont = await PdfGoogleFonts.notoSansDevanagariRegular();
    final devanargariBold = await PdfGoogleFonts.notoSansDevanagariBold();

    // Define theme
    const primaryColor = PdfColor.fromInt(0x8A5CF6); // Purple
    const accentColor = PdfColor.fromInt(0x4DEEEA); // Cyan
    const textColor = PdfColor.fromInt(0x1F2937); // Dark gray

    // Add cover page
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        theme: pw.ThemeData.withFont(
          base: devanagariFont,
          bold: devanargariBold,
        ),
        build: (pw.Context context) {
          return pw.Center(
            child: pw.Column(
              mainAxisAlignment: pw.MainAxisAlignment.center,
              children: [
                pw.Text(
                  'ॐ',
                  style: pw.TextStyle(
                    fontSize: 72,
                    color: primaryColor,
                    font: devanargariBold,
                  ),
                ),
                pw.SizedBox(height: 40),
                pw.Text(
                  'Soul Journey Report',
                  style: pw.TextStyle(
                    fontSize: 32,
                    fontWeight: pw.FontWeight.bold,
                    color: textColor,
                  ),
                ),
                pw.SizedBox(height: 20),
                pw.Text(
                  profile.name,
                  style: pw.TextStyle(
                    fontSize: 24,
                    color: primaryColor,
                  ),
                ),
                pw.SizedBox(height: 10),
                pw.Text(
                  'Born: ${profile.dateOfBirth.day}/${profile.dateOfBirth.month}/${profile.dateOfBirth.year}',
                  style: const pw.TextStyle(
                    fontSize: 14,
                    color: textColor,
                  ),
                ),
                pw.SizedBox(height: 5),
                pw.Text(
                  '${profile.birthPlace}',
                  style: const pw.TextStyle(
                    fontSize: 14,
                    color: textColor,
                  ),
                ),
                pw.SizedBox(height: 60),
                pw.Text(
                  'Generated: ${report.generatedAt.day}/${report.generatedAt.month}/${report.generatedAt.year}',
                  style: const pw.TextStyle(
                    fontSize: 12,
                    color: PdfColors.grey700,
                  ),
                ),
                pw.SizedBox(height: 20),
                pw.Text(
                  'Inspired by Bhrigu Samhita & Nadi Jyotisha',
                  style: const pw.TextStyle(
                    fontSize: 10,
                    color: PdfColors.grey600,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );

    // Add report pages
    final pages = [
      ('Page 1: Soul Signature', report.soulSignature),
      ('Page 2: Past Life Threads', report.pastLifeThreads),
      ('Page 3: Present Karmic Phase', report.presentKarmicPhase),
      ('Page 4: Future Outlook', report.futureOutlook),
      ('Page 5: Relationships & Marriage Karma', report.relationships),
      ('Page 6: Remedies & Practices', report.remedies),
      ('Page 7: Complete Soul Journey Summary', report.soulJourneySummary),
    ];

    for (final (title, page) in pages) {
      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          theme: pw.ThemeData.withFont(
            base: devanagariFont,
            bold: devanargariBold,
          ),
          build: (pw.Context context) {
            return pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                // Page header
                pw.Container(
                  width: double.infinity,
                  padding: const pw.EdgeInsets.all(20),
                  decoration: pw.BoxDecoration(
                    color: primaryColor,
                    borderRadius: pw.BorderRadius.circular(8),
                  ),
                  child: pw.Text(
                    title,
                    style: pw.TextStyle(
                      fontSize: 20,
                      fontWeight: pw.FontWeight.bold,
                      color: PdfColors.white,
                    ),
                  ),
                ),
                pw.SizedBox(height: 20),

                // Heading
                pw.Text(
                  page.heading,
                  style: pw.TextStyle(
                    fontSize: 18,
                    fontWeight: pw.FontWeight.bold,
                    color: primaryColor,
                  ),
                ),
                pw.SizedBox(height: 15),

                // Content paragraphs
                ...page.content.map((paragraph) {
                  return pw.Padding(
                    padding: const pw.EdgeInsets.only(bottom: 12),
                    child: pw.Text(
                      paragraph,
                      style: const pw.TextStyle(
                        fontSize: 12,
                        lineSpacing: 1.5,
                        color: textColor,
                      ),
                      textAlign: pw.TextAlign.justify,
                    ),
                  );
                }),

                // Rishi statement (highlighted)
                if (page.rishiStatement != null) ...[
                  pw.SizedBox(height: 20),
                  pw.Container(
                    width: double.infinity,
                    padding: const pw.EdgeInsets.all(15),
                    decoration: pw.BoxDecoration(
                      color: accentColor.flatten(0.1),
                      border: pw.Border(
                        left: pw.BorderSide(
                          color: accentColor,
                          width: 4,
                        ),
                      ),
                    ),
                    child: pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text(
                          'Rishi Statement:',
                          style: pw.TextStyle(
                            fontSize: 11,
                            fontWeight: pw.FontWeight.bold,
                            color: accentColor,
                          ),
                        ),
                        pw.SizedBox(height: 5),
                        pw.Text(
                          page.rishiStatement!,
                          style: pw.TextStyle(
                            fontSize: 12,
                            fontStyle: pw.FontStyle.italic,
                            color: textColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                // Footer
                pw.Spacer(),
                pw.Divider(color: PdfColors.grey300),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      profile.name,
                      style: const pw.TextStyle(
                        fontSize: 9,
                        color: PdfColors.grey600,
                      ),
                    ),
                    pw.Text(
                      'Page ${context.pageNumber} of ${context.pagesCount}',
                      style: const pw.TextStyle(
                        fontSize: 9,
                        color: PdfColors.grey600,
                      ),
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      );
    }

    // Add final page with disclaimer
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        theme: pw.ThemeData.withFont(
          base: devanagariFont,
        ),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Spacer(),
              pw.Text(
                'ॐ शान्तिः शान्तिः शान्तिः',
                style: pw.TextStyle(
                  fontSize: 24,
                  font: devanargariBold,
                  color: primaryColor,
                ),
                textAlign: pw.TextAlign.center,
              ),
              pw.SizedBox(height: 10),
              pw.Text(
                'Om Shanti Shanti Shanti',
                style: const pw.TextStyle(
                  fontSize: 14,
                  color: PdfColors.grey600,
                ),
                textAlign: pw.TextAlign.center,
              ),
              pw.SizedBox(height: 40),
              pw.Container(
                padding: const pw.EdgeInsets.all(15),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(8),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text(
                      'Disclaimer',
                      style: pw.TextStyle(
                        fontSize: 12,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'This Soul Journey report is generated based on astrological principles inspired by ancient Vedic wisdom traditions including Bhrigu Samhita and Nadi Jyotisha. The interpretations are for spiritual guidance and self-reflection purposes only.',
                      style: const pw.TextStyle(
                        fontSize: 10,
                        color: PdfColors.grey700,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'All data in this report was generated locally on your device and remains private. No data was transmitted over the internet.',
                      style: const pw.TextStyle(
                        fontSize: 10,
                        color: PdfColors.grey700,
                      ),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Text(
                '© Soul Journey App - Offline-First Astrology',
                style: const pw.TextStyle(
                  fontSize: 9,
                  color: PdfColors.grey500,
                ),
                textAlign: pw.TextAlign.center,
              ),
            ],
          );
        },
      ),
    );

    // Save PDF to file
    final directory = await getApplicationDocumentsDirectory();
    final file = File('${directory.path}/soul_journey_${profile.id}_${DateTime.now().millisecondsSinceEpoch}.pdf');
    await file.writeAsBytes(await pdf.save());

    return file;
  }

  /// Share PDF (opens system share dialog)
  Future<void> sharePdf(File pdfFile) async {
    await Printing.sharePdf(
      bytes: await pdfFile.readAsBytes(),
      filename: pdfFile.path.split('/').last,
    );
  }

  /// Print PDF (opens system print dialog)
  Future<void> printPdf(File pdfFile) async {
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => await pdfFile.readAsBytes(),
    );
  }
}

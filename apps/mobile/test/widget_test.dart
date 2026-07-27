import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';

void main() {
  testWidgets('Splash view smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const KryndexApp());

    // Verify that Splash view has KRYNDEX text
    expect(find.text('KRYNDEX'), findsOneWidget);
    expect(find.text('TRADE BEYOND LIMITS'), findsOneWidget);

    // Advance clock to trigger and clear the 3-second redirect Timer
    await tester.pump(const Duration(seconds: 3));
    await tester.pump();
  });
}

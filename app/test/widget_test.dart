import 'package:flutter_test/flutter_test.dart';
import 'package:sakti_ai_app/main.dart';

void main() {
  testWidgets('App boots and shows title', (tester) async {
    await tester.pumpWidget(const SaktiApp());
    expect(find.text('AI Studio'), findsWidgets);
  });
}

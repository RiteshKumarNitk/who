import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:who_gis_surveillance/presentation/widgets/stat_card.dart';
import 'package:who_gis_surveillance/core/theme/app_theme.dart';

void main() {
  testWidgets('StatCard displays label and value', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: Scaffold(
          body: StatCard(
            icon: Icons.people,
            label: 'ASHA Areas',
            value: '42',
            color: AppColors.primary,
          ),
        ),
      ),
    );

    expect(find.text('ASHA Areas'), findsOneWidget);
    expect(find.text('42'), findsOneWidget);
  });

  testWidgets('StatCard displays zero value', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme,
        home: Scaffold(
          body: StatCard(
            icon: Icons.home,
            label: 'Households',
            value: '0',
            color: AppColors.success,
          ),
        ),
      ),
    );

    expect(find.text('Households'), findsOneWidget);
    expect(find.text('0'), findsOneWidget);
  });
}

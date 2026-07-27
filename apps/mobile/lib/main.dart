import 'dart:async';
import 'package:flutter/material.dart';

void main() {
  runApp(const KryndexApp());
}

class KryndexApp extends StatelessWidget {
  const KryndexApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kryndex Exchange',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B0E11),
        primaryColor: const Color(0xFFF5B731),
        cardColor: const Color(0xFF151A21),
        dividerColor: const Color(0xFF2B3139),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFF5B731),
          secondary: Color(0xFFF5B731),
          surface: Color(0xFF151A21),
        ),
        textTheme: const TextTheme(
          bodyLarge: TextStyle(color: Color(0xFFF4F4F5)),
          bodyMedium: TextStyle(color: Color(0xFFA1A1AA)),
        ),
      ),
      home: const SplashView(),
    );
  }
}

// 1. SPLASH SCREEN
class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), () {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const OnboardingView()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF5B731), Color(0xFFD99A19)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Center(
                child: Text(
                  'K',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0B0E11),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'KRYNDEX',
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'TRADE BEYOND LIMITS',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                letterSpacing: 1.5,
                color: Color(0xFFF5B731),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// 2. ONBOARDING VIEW
class OnboardingView extends StatelessWidget {
  const OnboardingView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Spacer(),
            const Center(
              child: Text(
                '🛡️',
                style: TextStyle(fontSize: 80),
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Secure & Compliant Trading',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Double-entry ledgers and deterministic transaction settlements protect your portfolio assets.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFFA1A1AA),
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginView()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF5B731),
                foregroundColor: const Color(0xFF0B0E11),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'Log In / Get Started',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

// 3. LOGIN & REGISTER VIEW
class LoginView extends StatefulWidget {
  const LoginView({super.key});

  @override
  State<LoginView> createState() => _LoginViewState();
}

class _LoginViewState extends State<LoginView> {
  final _emailController = TextEditingController();
  final _passController = TextEditingController();
  bool _isRegister = false;
  bool _otpRequired = false;
  final _otpController = TextEditingController();

  void _handleSubmit() {
    if (_isRegister) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Mock Register: Code sent to ${_emailController.text}')),
      );
      setState(() {
        _isRegister = false;
      });
    } else {
      if (!_otpRequired) {
        setState(() {
          _otpRequired = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mock Login: 2FA challenge code requested. Enter any 6 digits.')),
        );
      } else {
        if (_otpController.text.length == 6) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => const MainLayout()),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('OTP must be 6 digits.')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Access Account'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 20),
            Text(
              _isRegister ? 'Register Account' : 'Welcome Back',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              _isRegister ? 'Set up trading credentials' : 'Enter security authorization parameters',
              style: const TextStyle(fontSize: 14, color: Color(0xFFA1A1AA)),
            ),
            const SizedBox(height: 32),
            if (!_otpRequired) ...[
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email Address',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ] else ...[
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, letterSpacing: 8, fontFamily: 'monospace'),
                decoration: InputDecoration(
                  labelText: '2FA TOTP Code',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _handleSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF5B731),
                foregroundColor: const Color(0xFF0B0E11),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                _isRegister ? 'Create Account' : (_otpRequired ? 'Verify Access' : 'Sign In'),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: () {
                setState(() {
                  _isRegister = !_isRegister;
                  _otpRequired = false;
                });
              },
              child: Text(
                _isRegister ? 'Already have an account? Sign In' : 'Create new exchange profile',
                style: const TextStyle(color: Color(0xFFF5B731)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// 4. MAIN NAVIGATION WRAPPER (SHELL)
class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  final List<Widget> _views = [
    const MobileHomeView(),
    const MobileMarketsView(),
    const MobileTradeView(),
    const MobileWalletView(),
    const MobileProfileView(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _views,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF151A21),
        selectedItemColor: const Color(0xFFF5B731),
        unselectedItemColor: const Color(0xFFA1A1AA),
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.trending_up_outlined), label: 'Markets'),
          BottomNavigationBarItem(icon: Icon(Icons.swap_horizontal_circle_outlined), label: 'Trade'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Wallet'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profile'),
        ],
      ),
    );
  }
}

// 5. HOME VIEW
class MobileHomeView extends StatelessWidget {
  const MobileHomeView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Kryndex Mobile'),
        backgroundColor: const Color(0xFF151A21),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined),
            onPressed: () => alertMock(context, 'Notifications Checklist is active'),
          )
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          // Total Balance Card
          Card(
            color: const Color(0xFF151A21),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: Color(0xFF2B3139)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Estimated Balance', style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 12)),
                  const SizedBox(height: 8),
                  const Text('\$10,250.00 USD', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 4),
                  const Text('≈ 0.152410 BTC', style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 11)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton(
                        onPressed: () => alertMock(context, 'Opening Deposit flow'),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF5B731), foregroundColor: const Color(0xFF0B0E11)),
                        child: const Text('Deposit'),
                      ),
                      ElevatedButton(
                        onPressed: () => alertMock(context, 'Opening Withdrawal flow'),
                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF1E2329), foregroundColor: Colors.white),
                        child: const Text('Withdraw'),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Markets Spot Hot', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 12),
          const HotMarketRow(symbol: 'BTC/USDT', price: '67,245.50', change: '+2.45%'),
          const HotMarketRow(symbol: 'ETH/USDT', price: '3,482.15', change: '-1.18%', isNegative: true),
        ],
      ),
    );
  }
}

// Helper hot market row
class HotMarketRow extends StatelessWidget {
  final String symbol;
  final String price;
  final String change;
  final bool isNegative;

  const HotMarketRow({
    super.key,
    required this.symbol,
    required this.price,
    required this.change,
    this.isNegative = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF151A21),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2B3139)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(symbol, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              const Text('Spot Market', style: TextStyle(fontSize: 10, color: Color(0xFFA1A1AA))),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(price, style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.bold)),
              Text(
                change,
                style: TextStyle(
                  fontSize: 11,
                  color: isNegative ? const Color(0xFFEA3943) : const Color(0xFF16C784),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}

// 6. MARKETS VIEW
class MobileMarketsView extends StatelessWidget {
  const MobileMarketsView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Markets'), backgroundColor: const Color(0xFF151A21)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          HotMarketRow(symbol: 'BTC/USDT', price: '67,245.50', change: '+2.45%'),
          HotMarketRow(symbol: 'ETH/USDT', price: '3,482.15', change: '-1.18%', isNegative: true),
          HotMarketRow(symbol: 'USDC/USDT', price: '1.0001', change: '+0.02%'),
        ],
      ),
    );
  }
}

// 7. TRADE VIEW
class MobileTradeView extends StatefulWidget {
  const MobileTradeView({super.key});

  @override
  State<MobileTradeView> createState() => _MobileTradeViewState();
}

class _MobileTradeViewState extends State<MobileTradeView> {
  bool _isBuy = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BTC/USDT Spot'), backgroundColor: const Color(0xFF151A21)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _isBuy = true),
                    style: ElevatedButton.styleFrom(backgroundColor: _isBuy ? const Color(0xFF16C784) : const Color(0xFF1E2329)),
                    child: const Text('Buy'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => setState(() => _isBuy = false),
                    style: ElevatedButton.styleFrom(backgroundColor: !_isBuy ? const Color(0xFFEA3943) : const Color(0xFF1E2329)),
                    child: const Text('Sell'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            TextField(
              decoration: InputDecoration(
                labelText: 'Price (USDT)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              controller: TextEditingController(text: '67245.00'),
            ),
            const SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: 'Amount (BTC)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              controller: TextEditingController(text: '0.10'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => alertMock(context, 'Mock Order placed successfully!'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _isBuy ? const Color(0xFF16C784) : const Color(0xFFEA3943),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(_isBuy ? 'Buy BTC' : 'Sell BTC', style: const TextStyle(fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }
}

// 8. WALLET VIEW
class MobileWalletView extends StatelessWidget {
  const MobileWalletView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet Details'), backgroundColor: const Color(0xFF151A21)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('BTC Wallet (Mock address)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF151A21),
                border: Border.all(color: const Color(0xFF2B3139)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                children: [
                  Icon(Icons.qr_code, size: 100, color: Colors.white),
                  SizedBox(height: 12),
                  Text(
                    'tb1q3y9x2n4x9u8w8q7y8z6x5v4u3t2s1r0q9p8o7n6m',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontFamily: 'monospace', fontSize: 12),
                  )
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// 9. PROFILE VIEW
class MobileProfileView extends StatelessWidget {
  const MobileProfileView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('User Center'), backgroundColor: const Color(0xFF151A21)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const ListTile(
            title: Text('Legal Account Profile'),
            subtitle: Text('Joshua Omatsuli'),
            leading: Icon(Icons.person_pin),
          ),
          const Divider(),
          const ListTile(
            title: Text('KYC Verification Level'),
            subtitle: Text('Standard Verified (Level 2)'),
            leading: Icon(Icons.verified_user_outlined),
          ),
          const Divider(),
          ListTile(
            title: const Text('Contact Support Desk'),
            subtitle: const Text('Create support ticket thread'),
            leading: const Icon(Icons.support_agent_outlined),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SupportFormView()),
              );
            },
          )
        ],
      ),
    );
  }
}

// 10. SUPPORT FORM VIEW
class SupportFormView extends StatelessWidget {
  const SupportFormView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support Desk'), backgroundColor: const Color(0xFF151A21)),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Open Technical Ticket', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                labelText: 'Ticket Subject',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              maxLines: 4,
              decoration: InputDecoration(
                labelText: 'Details / Description',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Support ticket opened successfully!')),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF5B731),
                foregroundColor: const Color(0xFF0B0E11),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Submit Ticket', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }
}

// Global mockup helper
void alertMock(BuildContext context, String message) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('System Notification'),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        )
      ],
    ),
  );
}

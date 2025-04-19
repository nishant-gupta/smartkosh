import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-4 md:px-6 lg:px-8">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold flex items-center">
            <span className="bg-gray-900 text-white p-1 rounded">📊</span>
            <span className="ml-2">SmartKosh</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-gray-700 hover:text-gray-900">
            Log in
          </Link>
          <Link href="/register" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Sign up free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="text-center py-16 px-4 md:py-20 lg:py-24">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
          Understand Your Money,<br />Effortlessly
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Track spending, visualize trends, and get AI-powered insights to improve your financial health.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link href="/register" className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-lg shadow-gray-200">
            Get Started Now
          </Link>
          <Link href="#how-it-works" className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            See How It Works
          </Link>
        </div>
        <div className="flex flex-wrap justify-center items-center space-x-4 md:space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="mr-2 text-gray-900">🔒</span>
            <span>Bank-level security</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-gray-900">✓</span>
            <span>Trusted by 10,000+ users</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 text-2xl text-gray-900">🔗</div>
            <h3 className="text-xl font-semibold mb-2">All Your Finances, One Place</h3>
            <p className="text-gray-600">
              Securely link bank accounts or easily upload statements. We automatically organize everything.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 text-2xl text-gray-900">📊</div>
            <h3 className="text-xl font-semibold mb-2">See Where Money Goes</h3>
            <p className="text-gray-600">
              Instantly understand your spending habits with clear, interactive charts and trend reports.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 text-2xl text-gray-900">💡</div>
            <h3 className="text-xl font-semibold mb-2">Smart Financial Advice</h3>
            <p className="text-gray-600">
              Our AI analyzes your data to provide personalized tips, identify savings, and guide your planning.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
            <div className="mb-4 text-2xl text-gray-900">🛡️</div>
            <h3 className="text-xl font-semibold mb-2">Your Data is Safe</h3>
            <p className="text-gray-600">
              We use bank-level security and encryption. Your sensitive information is always protected.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">1</div>
              <h3 className="text-xl font-semibold mb-2">Connect Your Accounts</h3>
              <p className="text-gray-600">Securely link your financial accounts or upload statements</p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">2</div>
              <h3 className="text-xl font-semibold mb-2">AI Analysis</h3>
              <p className="text-gray-600">Our AI categorizes transactions and identifies patterns</p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg">3</div>
              <h3 className="text-xl font-semibold mb-2">Get Insights</h3>
              <p className="text-gray-600">Receive personalized advice and clear visualizations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden mr-4 flex items-center justify-center text-gray-700 font-bold">SJ</div>
                <div>
                  <h4 className="font-semibold">Sarah Johnson</h4>
                  <p className="text-sm text-gray-600">Busy Professional</p>
                </div>
              </div>
              <p className="text-gray-700">
                "This app has completely transformed how I manage my finances. The AI insights are incredibly helpful!"
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden mr-4 flex items-center justify-center text-gray-700 font-bold">MC</div>
                <div>
                  <h4 className="font-semibold">Mike Chen</h4>
                  <p className="text-sm text-gray-600">Small Business Owner</p>
                </div>
              </div>
              <p className="text-gray-700">
                "Finally, an app that makes financial planning simple and actually enjoyable to use."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Ready to Take Control of Your Finances?</h2>
          <p className="mb-8 text-gray-100">Join thousands of users who have transformed their financial life</p>
          <Link href="/register" className="bg-white text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-100 font-medium inline-block transition-colors shadow-lg">
            Start Free Trial
          </Link>
          <p className="text-sm text-gray-200 mt-4">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold flex items-center">
                <span className="bg-gray-900 text-white p-1 rounded">📊</span>
                <span className="ml-2">SmartKosh</span>
              </span>
            </div>
            <p className="text-sm text-gray-600">Your smart financial assistant</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">About</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">Careers</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">Press</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">Privacy</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">Terms</Link></li>
              <li><Link href="#" className="text-gray-600 hover:text-gray-900">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-8 border-t text-center text-sm text-gray-500">
          © 2025 SmartKosh. All rights reserved.
        </div>
      </footer>
    </main>
  )
} 
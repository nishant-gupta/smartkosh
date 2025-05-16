import Link from 'next/link'
import Image from 'next/image'
import { getIcon } from '@/utils/icons'

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
                {getIcon('twitter', { className: 'w-5 h-5' })}
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                {getIcon('github', { className: 'w-5 h-5' })}
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900">
                {getIcon('dribbble', { className: 'w-5 h-5' })}
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
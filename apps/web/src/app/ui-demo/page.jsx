'use client';

import {
  ModernButton,
  ModernCard,
  ModernInput,
  ModernBadges,
  ModernTable,
  ModernAlert,
  ModernIconButtons
} from '../../components/ModernUIExamples';

export default function UIDemo() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Modern UI Components
          </h1>
          <p className="text-lg text-neutral-600">
            Tema Korporat Biru dengan Icon Line Style
          </p>
        </div>

        {/* Color Palette */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Palet Warna</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Colors */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Primary Blue</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">primary-500</p>
                    <p className="text-xs text-neutral-600">#3b82f6</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">primary-600</p>
                    <p className="text-xs text-neutral-600">#2563eb</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-700 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">primary-700</p>
                    <p className="text-xs text-neutral-600">#1d4ed8</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Accent Colors */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Accent Blue</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent-400 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">accent-400</p>
                    <p className="text-xs text-neutral-600">#38bdf8</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent-500 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">accent-500</p>
                    <p className="text-xs text-neutral-600">#0ea5e9</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-accent-600 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">accent-600</p>
                    <p className="text-xs text-neutral-600">#0284c7</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Neutral Colors */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Neutral Gray</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-neutral-100 rounded-lg border border-neutral-300"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">neutral-100</p>
                    <p className="text-xs text-neutral-600">#f5f5f5</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-neutral-500 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">neutral-500</p>
                    <p className="text-xs text-neutral-600">#737373</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-neutral-900 rounded-lg"></div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">neutral-900</p>
                    <p className="text-xs text-neutral-600">#171717</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Buttons</h2>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <ModernButton />
          </div>
        </section>

        {/* Icon Buttons */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Icon Buttons</h2>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <ModernIconButtons />
          </div>
        </section>

        {/* Badges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Badges</h2>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <ModernBadges />
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ModernCard />
            <ModernCard />
          </div>
        </section>

        {/* Inputs */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Form Inputs</h2>
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
            <ModernInput />
          </div>
        </section>

        {/* Alerts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Alerts</h2>
          <ModernAlert />
        </section>

        {/* Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Table</h2>
          <ModernTable />
        </section>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <p className="text-center text-neutral-600">
            Semua komponen menggunakan tema biru korporat dengan icon line style
          </p>
        </div>
      </div>
    </div>
  );
}

'use client'

import { useLanguage } from '@/lib/i18n/language-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { CalendarDays, Clock, Users, RefreshCw } from 'lucide-react'

export function HomeContent() {
  const { t } = useLanguage()

  return (
    <main className="max-w-6xl mx-auto px-4 py-16">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
          <CalendarDays className="h-4 w-4" />
          {t.home.badge}
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6 text-balance">
          <>
            {t.home.title} <br className="hidden sm:block" />
            {t.home.titleBreak}
          </>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          {t.home.subtitle}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">{t.home.getStarted}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">{t.home.signIn}</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.home.feature1Title}</h3>
          <p className="text-muted-foreground">
            {t.home.feature1Desc}
          </p>
        </Card>

        <Card className="p-6">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.home.feature2Title}</h3>
          <p className="text-muted-foreground">
            {t.home.feature2Desc}
          </p>
        </Card>

        <Card className="p-6">
          <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.home.feature3Title}</h3>
          <p className="text-muted-foreground">
            {t.home.feature3Desc}
          </p>
        </Card>
      </section>
    </main>
  )
}

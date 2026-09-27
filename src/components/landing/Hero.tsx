"use client";

import Link from "next/link";
import { useState } from "react";
import HomeEstimator from "./HomeEstimator";

export default function Hero() {
  const [estimateOpen, setEstimateOpen] = useState(false);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="order-1">
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
              Livraison de proximité
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Vos besoins du quotidien, livrés simplement.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Faites récupérer un colis, un achat, une commande ou un objet
              oublié. Jalin Livraison vous met en relation avec un livreur de
              proximité pour vous simplifier la vie.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?next=/client/new-order"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Demander une livraison
              </Link>

              <Link
                href="/livreur/signup"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Devenir livreur
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setEstimateOpen((current) => !current)}
              className="mt-4 flex w-full items-center justify-between rounded-xl border-2 border-blue-200 bg-blue-50 px-5 py-4 text-left font-bold text-blue-800 transition hover:bg-blue-100 sm:max-w-md"
              aria-expanded={estimateOpen}
            >
              <span>Estimation rapide</span>

              <span
                className={`text-xl transition-transform duration-200 ${
                  estimateOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                ▼
              </span>
            </button>

            <p className="mt-2 text-sm text-slate-500">
              Calculez votre distance et votre tarif avant de créer votre
              compte.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
              <span>✓ Simple</span>
              <span>✓ Proximité</span>
              <span>✓ En toute sécurité</span>
            </div>
          </div>

          {estimateOpen && (
            <div className="order-2 -mx-2 lg:order-3 lg:col-span-2 lg:mx-0">
              <HomeEstimator />
            </div>
          )}

          <div className="order-3 relative min-h-[380px] overflow-hidden rounded-[1.5rem] bg-slate-100 lg:order-2">
            <img
              src="/jalin-hero.png"
              alt="Livreuse de proximité Jalin Livraison"
              className="absolute inset-0 h-full w-full object-contain"
            />

            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/95 p-4 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                Jalin Livraison
              </p>

              <p className="mt-1 font-bold text-slate-900">
                Livraison simple, rapide et efficace
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

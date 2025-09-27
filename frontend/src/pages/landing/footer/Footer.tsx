
export default function Footer() {
  return (
    <section id="contact">

    <footer className="bg-black text-white py-12  ">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="flex flex-wrap justify-center gap-8 mb-8">
          <a
            href="#"
            className="text-xl font-bold hover:text-[#0ea5a4] transition-colors"
          >
            ABOUT
          </a>
          <a
            href="#demo"
            className="text-xl font-bold hover:text-[#fbbf24] transition-colors"
          >
            DOCS
          </a>
          <a
            href="#"
            className="text-xl font-bold hover:text-[#ec4899] transition-colors"
          >
            GITHUB
          </a>
          <a
            href="#demo"
            className="text-xl font-bold hover:text-[#0ea5a4] transition-colors"
          >
            DEMO VIDEO
          </a>
        </div>

        <p className="text-lg font-bold opacity-80">
          © 2025 FITCONQUER - RUN • CAPTURE • CONQUER
        </p>
      </div>
    </footer>
    </section>
  );
}

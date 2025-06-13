import Link from "next/link"
import { Linkedin } from "lucide-react"

export function Footer() {
  return (
    /* // Footer principal - Responsivo */
    <footer className="mt-auto border-t bg-[#8DC73F]/10 py-6 text-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          {/* // Copyright - Identidad de marca */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-600">© 2025 JM Software. Todos los derechos reservados.</p>
          </div>

          {/* // Créditos del diseñador */}
          <div className="flex items-center space-x-2">
            <p className="text-sm text-gray-600">Diseñado por: ING. Jose Manuel De Jesus</p>
            {/* // Enlace a LinkedIn con color de marca */}
            <Link
              href="https://www.linkedin.com/in/josé-manuel-de-jesús-rodríguez-5a0981177"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-full bg-[#8DC73F] p-2 text-white transition-colors hover:bg-[#8DC73F]/80"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

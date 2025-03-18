import clsx from 'clsx'
import { Link } from 'react-router'

import { ModuleHeader, ModuleWrapper } from '@lifeforge/ui'

import useComponentBg from '@hooks/useComponentBg'

function CFOPAlgorithms() {
  const { componentBgWithHover } = useComponentBg()

  return (
    <ModuleWrapper>
      <ModuleHeader icon="tabler:cube" title="CFOP Algorithms" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries({
          F2L: 'First Two Layers',
          OLL: 'Orientation of the Last Layer',
          PLL: 'Permutation of the Last Layer'
        }).map(([key, value]) => (
          <Link
            key={key}
            className={clsx(
              'shadow-custom flex flex-col items-center justify-center rounded-md p-4 transition-all',
              componentBgWithHover
            )}
            to={`/cfop-algorithms/${key.toLowerCase()}`}
          >
            <img
              alt={key}
              className="mb-8 size-48"
              src={`/assets/cfop/landing-${key.toLowerCase()}.webp`}
            />
            <h2 className="text-center text-5xl font-semibold tracking-wider">
              {key}
            </h2>
            <p className="mt-2 text-center text-xl">{value}</p>
          </Link>
        ))}
      </div>
    </ModuleWrapper>
  )
}

export default CFOPAlgorithms

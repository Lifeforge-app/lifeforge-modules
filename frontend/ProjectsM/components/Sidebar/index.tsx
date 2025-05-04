import { useNavigate, useSearchParams } from 'react-router'

import { SidebarDivider, SidebarItem, SidebarWrapper } from '@lifeforge/ui'

import { useProjectsMContext } from '../../providers/ProjectsMProvider'
import SidebarSection from './components/SidebarSection'

function Sidebar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { sidebarOpen, setSidebarOpen } = useProjectsMContext().miscellaneous

  return (
    <SidebarWrapper isOpen={sidebarOpen} setOpen={setSidebarOpen}>
      <SidebarItem
        active={searchParams.entries().next().done === true}
        icon="tabler:list"
        name="All Projects"
        namespace="apps.projectsM"
        onClick={() => {
          navigate('/projects-m')
        }}
      />
      <SidebarItem
        active={searchParams.get('starred') === 'true'}
        icon="tabler:star-filled"
        name="Starred"
        namespace="apps.projectsM"
        onClick={() => {
          navigate('/projects-m?starred=true')
        }}
      />
      {(
        ['categories', 'statuses', 'visibilities', 'technologies'] as const
      ).map(stuff => (
        <>
          <SidebarDivider />
          <SidebarSection stuff={stuff} />
        </>
      ))}
    </SidebarWrapper>
  )
}

export default Sidebar

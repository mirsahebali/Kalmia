import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NavLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { getDocumentations } from "../../api/Requests";
import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ModalContext } from "../../context/ModalContext";
import { Documentation } from "../../types/doc";
import { handleError, hasPermission } from "../../utils/Common";

export default function Sidebar() {
  const { t } = useTranslation();

  const PoweredByDifuse = () => {
    return (
      <div className="flex items-center justify-center space-x-1 text-sm dark:text-white">
        <span className="font-semibold">{t("crafted_by")}</span>
        <a
          href="https://difuse.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1353.12 332.46"
            className="h-6 ml-1 dark:fill-white fill-[#031159]"
          >
            <g id="Layer_2" data-name="Layer 2">
              <g id="Layer_1-2" data-name="Layer 1">
                <path d="M510.71,109a56.77,56.77,0,0,1,23.22,22.32q8.22,14.35,8.22,33.15,0,18.62-8.22,33.07a56.48,56.48,0,0,1-23.31,22.41q-15.09,8-35,8H428.13V101h47.53Q495.71,101,510.71,109ZM501,191.54q9.75-9.58,9.75-27.11T501,137.15q-9.76-9.77-27.29-9.76H459v73.73h14.64Q491.19,201.12,501,191.54Z" />
                <path d="M655.45,101V227.86h-30.9V101Z" />
                <path d="M825.49,101v24.75H773.81v26.75h38.67v24H773.81v51.32h-30.9V101Z" />
                <path d="M937.16,101V176.9q0,11.39,5.6,17.53t16.44,6.14q10.84,0,16.63-6.14t5.78-17.53V101h30.9v75.71q0,17-7.23,28.73a46.26,46.26,0,0,1-19.42,17.71,61.07,61.07,0,0,1-27.2,6,59.48,59.48,0,0,1-26.83-5.87,43.71,43.71,0,0,1-18.7-17.71q-6.89-11.83-6.87-28.82V101Z" />
                <path d="M1120.2,224.61a40.61,40.61,0,0,1-17.62-13.38q-6.58-8.85-6.95-21.32h32.88q.72,7.05,4.88,10.75t10.84,3.71q6.87,0,10.85-3.16a10.61,10.61,0,0,0,4-8.77,10.37,10.37,0,0,0-3.16-7.77,25.61,25.61,0,0,0-7.77-5.06,126.91,126.91,0,0,0-13.1-4.52,142.88,142.88,0,0,1-20.06-7.58,37,37,0,0,1-13.37-11.21q-5.6-7.4-5.6-19.33,0-17.72,12.83-27.74t33.43-10q21,0,33.79,10t13.73,27.92h-33.43a13.08,13.08,0,0,0-4.52-9.67,15.9,15.9,0,0,0-10.66-3.52,13.25,13.25,0,0,0-9,3q-3.44,3-3.44,8.58,0,6.15,5.79,9.58t18.07,7.41a166.93,166.93,0,0,1,20,8,38.05,38.05,0,0,1,13.28,11q5.61,7.23,5.61,18.61a36.56,36.56,0,0,1-5.51,19.7,38.63,38.63,0,0,1-16,14.09q-10.47,5.25-24.75,5.24A65.29,65.29,0,0,1,1120.2,224.61Z" />
                <path d="M1306.32,125.76v25.66h41.38v23.86h-41.38V203.1h46.8v24.76h-77.7V101h77.7v24.75Z" />
                <polygon points="369.78 166.23 273.78 332.46 82.27 332.46 0 189.99 54.78 189.99 109.62 284.97 246.39 284.97 314.97 166.23 246.39 47.49 109.62 47.49 54.78 142.47 0 142.47 82.27 0 273.78 0 369.78 166.23" />
                <polygon points="219.07 94.98 136.77 94.98 109.36 142.47 191.69 142.47 205.41 166.23 191.69 189.99 109.36 189.99 136.77 237.48 219.07 237.48 260.19 166.23 219.07 94.98" />
              </g>
            </g>
          </svg>
        </a>
      </div>
    );
  };

  const authContext = useContext(AuthContext);
  const [documentation, setDocumentation] = useState<Documentation[]>([]);
  const [openDropdowns, setOpenDropdowns] = useState<boolean[]>([]);
  const [searchParam] = useSearchParams();
  const docId = searchParam.get("id");
  const navigate = useNavigate();
  const { refresh, userDetails, isSidebarOpen, setIsSidebarOpen } =
    authContext as AuthContextType;
  const { openModal } = useContext(ModalContext);
  const location = useLocation();
  const path = location.pathname + location.search;

  const isActive = [
    "user-list",
    "edit-user",
    "user-profile",
    "create-user",
  ].some((substring) => path.includes(substring));

  useEffect(() => {
    const fetchData = async () => {
      const documentations = await getDocumentations();
      if (handleError(documentations, navigate, t)) return;
      if (documentations.status === "success") {
        const data = documentations.data;
        setDocumentation(data);
      }
    };

    fetchData();
  }, [refresh, navigate, t]);

  const toggleDropdown = (index: number) => {
    const updatedDropdowns = [...openDropdowns];
    updatedDropdowns[index] = !updatedDropdowns[index];
    setOpenDropdowns(updatedDropdowns);
  };

  const smallestId = documentation.reduce(
    (min, doc) => (doc.id < min ? doc.id : min),
    documentation[0]?.id
  );

  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const [newDocumentDropdown, setNewDocumentDropdown] =
    useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleClickOutside = (
    ref: React.RefObject<HTMLElement>,
    setState: (state: boolean) => void
  ) => {
    return (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setState(false);
      }
    };
  };

  useEffect(() => {
    const handleSidebarClick = handleClickOutside(sidebarRef, setIsSidebarOpen);
    const handleDropdownClick = handleClickOutside(
      dropdownRef,
      setNewDocumentDropdown
    );

    document.addEventListener("mousedown", handleSidebarClick);
    document.addEventListener("mousedown", handleDropdownClick);

    return () => {
      document.removeEventListener("mousedown", handleSidebarClick);
      document.removeEventListener("mousedown", handleDropdownClick);
    };
  }, [sidebarRef, setIsSidebarOpen, dropdownRef, setNewDocumentDropdown]);

  return (
    <AnimatePresence>
      <motion.aside
        ref={sidebarRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.1 }}
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-14 transition-transform bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
        aria-label="Sidenav"
        id="drawer-navigation"
        key="sidebar-aside-container"
      >
        <div
          className="flex flex-col overflow-y-auto py-5 px-3 h-full bg-white dark:bg-gray-800"
          key="sidebar-wrapper"
        >
          <ul className="space-y-2" key="documentation-sidebar-list">
            <li className="md:hidden" key="sidebar-logo">
              <NavLink to="/dashboard" className="">
                {/* <h1 className='text-blue-500 font-bold hidden sm:block'>CMS</h1> */}
                <img
                  src="/assets/images/cropped.png"
                  alt="logo"
                  className="w-48 h-10 dark:invert"
                />
              </NavLink>
            </li>
            {hasPermission(["all", "write"], userDetails) && (
              <li className="relative inline-block z-20 w-full">
                <button
                  onClick={() => {
                    newDocumentDropdown
                      ? setNewDocumentDropdown(false)
                      : setNewDocumentDropdown(true);
                  }}
                  id="dropdownDefaultButton"
                  data-dropdown-toggle="dropdown"
                  className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex  justify-center items-center gap-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  type="button"
                >
                  <Icon
                    icon="gridicons:add-outline"
                    className="w-6 h-6 dark:text-white"
                  />
                  New
                </button>
                {newDocumentDropdown && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    ref={dropdownRef}
                    className="w-full absolute mt-2 right-0 lg:left-0 bg-white rounded-lg shadow-2xl shadow-gary-400 border border-gray-300 dark:border-none dark:bg-gray-700 z-30"
                  >
                    <motion.ul
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className=" text-sm text-gray-700 rounded-lg dark:text-gray-200 divide-y divide-gray-200 dark:divide-gray-600 overflow-hidden"
                      aria-labelledby="new-documnetation-dropdown"
                    >
                      <motion.li
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full hover:bg-gray-200 py-1 cursor-pointer dark:hover:bg-gray-600 "
                      >
                        <div
                          className={`flex w-full text-start items-center  rounded "}`}
                          onClick={() => {
                            openModal("createDocumentation", null);
                            navigate("/dashboard/create-documentation");
                          }}
                        >
                          <p className="w-full p-2.5 ms-2 text-md font-medium text-gray-900 rounded dark:text-gray-300">
                            {t("new_documentation")}
                          </p>
                        </div>
                      </motion.li>
                      <motion.li
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full hover:bg-gray-200 py-1 cursor-pointer dark:hover:bg-gray-600 "
                      >
                        <div
                          className={`flex w-full text-start items-center  rounded "}`}
                          onClick={() => {
                            openModal("gitBookModal", null);
                          }}
                        >
                          <p className="w-full p-2.5 ms-2 text-md font-medium text-gray-900 rounded dark:text-gray-300">
                            {t("import_gitbook")}
                          </p>
                        </div>
                      </motion.li>
                    </motion.ul>
                  </motion.div>
                )}
              </li>
            )}
            {!documentation || documentation.length <= 0 ? (
              <motion.li
                whileHover={{ scale: 1.05, originX: 0 }}
                key="no-documentation"
              >
                <p className="flex cursor-default items-center p-5 w-full text-base font-normal text-gray-600 rounded-lg transition duration-75 group ">
                  <span className="flex-1 ml-3 text-left whitespace-nowrap">
                    {t("no_documentations")}
                  </span>
                </p>
              </motion.li>
            ) : (
              documentation
                .filter((obj) => obj.clonedFrom === null)
                .map((val, index) => (
                  <motion.li
                    key={`sidebar-${val.id}-${index}`}
                    whileHover={{ scale: 1.03, originX: 0 }}
                  >
                    <NavLink
                      to={`/dashboard/documentation?id=${val.id}`}
                      onClick={() => toggleDropdown(index)}
                      className={`flex items-center p-2 w-full text-base font-normal rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700 ${
                        (location.pathname === "/dashboard" &&
                          val.id === smallestId) ||
                        val.id === Number(docId)
                          ? "text-black-500 bg-gray-300 dark:bg-gray-600"
                          : "text-gray-900"
                      }`}
                      aria-controls={`${val.name}`}
                      title={val.name}
                    >
                      <Icon
                        icon="uiw:document"
                        className="w-8 h-8 dark:text-white"
                      />
                      <span className="flex-1 px-1 text-left overflow-hidden text-md whitespace-nowrap overflow-ellipsis">
                        {val.name}
                      </span>
                    </NavLink>
                  </motion.li>
                ))
            )}
          </ul>

          {userDetails && userDetails.admin && (
            <ul
              className="pt-5 mt-5 space-y-2 border-t border-gray-200 dark:border-gray-700"
              key="user-management-lists"
            >
              <motion.li whileHover={{ scale: 1.03, originX: 0 }}>
                <NavLink
                  to="/dashboard/admin/user-list"
                  className={`flex items-center p-2 w-full text-base font-normal text-gray-900 rounded-lg transition duration-75 group hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700
                    ${
                      isActive
                        ? "text-black-500 bg-gray-300 dark:bg-gray-600"
                        : "text-gray-900"
                    }
                    `}
                  aria-controls=""
                  title={t("user_management")}
                >
                  <Icon icon="mdi:users" className="w-8 h-8 dark:text-white" />
                  <span className="flex-1 px-1 text-left overflow-hidden text-md whitespace-nowrap overflow-ellipsis">
                    {t("user_management")}
                  </span>
                </NavLink>
              </motion.li>
            </ul>
          )}

          <div className="mt-auto flex justify-center space-y-2 border-t border-gray-200 dark:border-gray-700">
            <hr />

            <PoweredByDifuse />
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

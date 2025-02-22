import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink } from "react-router-dom";

import { AuthContext, AuthContextType } from "../../context/AuthContext";
import { ThemeContext, ThemeContextType } from "../../context/ThemeContext";
import { DOMEvent } from "../../types/dom";
import { getLanguageName, languages } from "../../utils/Utils";

export default function Navbar() {
  const { i18n } = useTranslation();
  const authContext = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);
  const languageName = getLanguageName();

  const { t } = useTranslation();
  const { userDetails, logout, isSidebarOpen, setIsSidebarOpen } =
    authContext as AuthContextType;
  const { darkMode, toggleDarkMode } = themeContext as ThemeContextType;

  const [isOpen, setIsOpen] = useState(false);
  const [translateDropdown, setTranslateDropdown] = useState(false);
  const toggleTranslateDropdown = () =>
    setTranslateDropdown(!translateDropdown);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const handleClickOutside = useCallback(
    (event: DOMEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setTranslateDropdown(false);
      }
    },
    [setIsOpen, setTranslateDropdown]
  );

  useEffect(() => {
    if (isOpen || translateDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, translateDropdown, handleClickOutside]);

  const changeLanguage = (lng: string) => {
    if (lng === i18n.language) return;
    i18n.changeLanguage(lng);
    setTranslateDropdown(false);
  };

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-white border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50"
        key="navbar"
      >
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex justify-start items-center">
            <NavLink to="/dashboard" className="hidden md:block">
              {/* <h1 className='text-blue-500 font-bold hidden sm:block'>CMS</h1> */}
              <img
                src="/assets/images/cropped.png"
                alt="logo"
                className="w-42 h-8 dark:invert"
              />
            </NavLink>
            <button
              onClick={toggleSidebar}
              data-drawer-target="drawer-navigation"
              data-drawer-toggle="drawer-navigation"
              aria-controls="drawer-navigation"
              className="p-2 mr-2 text-gray-600 rounded-lg cursor-pointer md:hidden hover:text-gray-900 hover:bg-gray-100 focus:bg-gray-100 dark:focus:bg-gray-700 focus:ring-2 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <Icon
                icon="akar-icons:three-line-horizontal"
                className="w-7 h-7"
              />
              <span className="sr-only">{t("toggle_sidebar")}</span>
            </button>
          </div>

          <div className="flex items-center sm:gap-2">
            <div className="relative ">
              <button
                type="button"
                className="flex items-center gap-1 dark:text-white hover:bg-gray-200 drak:bg-gray-800 rounded-md dark:hover:bg-gray-600 py-2 px-2"
                onClick={toggleTranslateDropdown}
              >
                <Icon icon="material-symbols:translate" />
                <span className="text-md">{languageName}</span>
                <Icon icon="mingcute:down-line" className="w-6 h-6" />
              </button>

              {translateDropdown && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute top-9 left-0 z-50 my-4 overflow-hidden text-base list-none bg-white divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 rounded-md border border-gray-200 dark:border-gray-600"
                  key="user-details-dropdown"
                >
                  <ul className="w-32  text-start text-sm font-medium text-gray-900 dark:text-white">
                    {languages.map((lng) => (
                      <li
                        key={lng.code}
                        onClick={() => changeLanguage(lng.code)}
                        className={`w-full py-2 px-3  cursor-pointer ${lng.code === i18n.language ? "bg-gray-400 dark:bg-gray-800 cursor-text" : "dark:hover:bg-gray-600 hover:bg-gray-200"}`}
                      >
                        {lng.lang}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="darkModeSwitch"
                  className="sr-only peer"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                />
                {darkMode ? (
                  <p className="text-gray-500 dark:text-gray-400  hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 w-10 h-10 inline-flex items-center justify-center">
                    <Icon
                      icon="ph:sun-light"
                      className="w-10 h-10 text-yellow-300"
                    />
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400  hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 w-10 h-10 inline-flex items-center justify-center">
                    <Icon
                      icon="bi:moon-fill"
                      className="w-10 h-10 pt-1 text-gray-700"
                    />
                  </p>
                )}
              </label>
            </div>

            {userDetails ? (
              <div className="relative">
                <button
                  type="button"
                  className="flex mx-3 text-sm bg-gray-800 rounded-full md:mr-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                  id="user-menu-button"
                  aria-expanded={isOpen}
                  onClick={toggleDropdown}
                  data-dropdown-toggle={`Dropdown-user-${userDetails.id}`}
                >
                  <span className="sr-only">{t("open_user_menu")}</span>

                  <img
                    className="w-8 h-8 rounded-full object-cover"
                    src={userDetails?.photo || "/assets/images/no-profile.png"}
                    alt="user"
                  />
                </button>

                {isOpen && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute right-0 z-50 my-4 overflow-hidden text-base list-none bg-white  divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 rounded-xl"
                    id={`Dropdown-user-${userDetails.id}`}
                    key="user-details-dropdown"
                  >
                    <Link
                      to={`/dashboard/user-profile/${userDetails.id}`}
                      onClick={() => setIsOpen(!isOpen)}
                    >
                      <div className="py-3 px-4 hover:bg-gray-300 dark:hover:bg-gray-500 cursor-pointer">
                        <span className="block text-md font-semibold text-gray-900 dark:text-white">
                          {userDetails.username}
                        </span>
                        <span className="block text-md text-gray-900 truncate dark:text-white">
                          {userDetails.email}
                        </span>
                      </div>
                    </Link>

                    <div className="px-4 hover:bg-gray-300 dark:hover:bg-gray-500 cursor-pointer">
                      <span
                        onClick={() => logout()}
                        className="block text-md py-3 font-semibold text-gray-900 dark:text-white"
                      >
                        {t("sign_out")}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="hidden" />
            )}
          </div>
        </div>
      </motion.nav>
    </AnimatePresence>
  );
}

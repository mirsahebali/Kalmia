import "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/theme-github";

import data from "@emoji-mart/data";
import { EmojiMartData } from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import EmojiClickData from "@emoji-mart/react";
import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useContext, useEffect, useRef, useState } from "react";
import AceEditor from "react-ace";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  ApiResponse,
  createDocumentation,
  DocumentationPayload,
  getDocumentation,
  updateDocumentation,
  uploadAssetsFile,
} from "../../api/Requests";
import { ModalContext } from "../../context/ModalContext";
import { ThemeContext, ThemeContextType } from "../../context/ThemeContext";
import AddButton from "../../lib/components/AddButton";
import DeleteButton from "../../lib/components/DeleteButton";
import ToggleSwitch from "../../lib/components/ToggleSwitch";
import {
  Documentation,
  Features,
  FooterLabelLinks,
  FormData,
  FormFieldData,
  LanderDetails,
  MoreLabelLinks,
} from "../../types/doc";
import {
  convertToEmoji,
  handleError,
  landingPageValidate,
  useOutsideAlerter,
  validateCommunityFields,
  validateFormData,
} from "../../utils/Common";
import { toastMessage } from "../../utils/Toast";
import { customCSSInitial, SocialLinkIcon } from "../../utils/Utils";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import { UploadFormField } from "./UploadFormField";
import { AxiosError } from "axios";

const FormField: React.FC<FormFieldData> = ({
  label,
  placeholder,
  value = "",
  onChange,
  name,
  type = "text",
  required = false,
  ref,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <div className="relative">
        <input
          ref={ref}
          onChange={onChange}
          value={value}
          type={type === "password" && showPassword ? "text" : type}
          name={name}
          id={name}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          placeholder={placeholder}
          required={required}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 bg-gray-50 dark:bg-gray-700"
          >
            {showPassword ? (
              <Icon icon="bx:bxs-show" className="w-5 h-5 text-gray-400" />
            ) : (
              <Icon icon="bx:bxs-hide" className="w-5 h-5 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

type HandleArrayFieldChange = (
  index: number,
  field: string,
  newValue: string,
  state: MoreLabelLinks[] | FooterLabelLinks[],
  saveField: "moreFooter" | "socialPlatform",
) => void;

type LanderDetailsKeys = keyof LanderDetails;

export default function CreateDocModal() {
  // Contexts
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParam] = useSearchParams();
  const { openModal, closeModal, setLoadingMessage } = useContext(ModalContext);
  const themeContext = useContext(ThemeContext);
  const { darkMode } = themeContext as ThemeContextType;

  // Search Parameters
  const docIdString = searchParam.get("id");
  const docId: number | null = docIdString ? parseInt(docIdString) : null;
  const mode = searchParam.get("mode");

  // State Variables
  const [isAuthenticationToggleOn, SetIsAuthenticationToggleOn] = useState<
    boolean | undefined
  >(false);
  const [isToggleOn, SetIsToggleOn] = useState<boolean | undefined>(false);
  const [gitDeployOn, SetGitDeployOn] = useState<boolean | undefined>(false);
  const [activeFieldIndex, setActiveFieldIndex] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null,
  );
  const [isIconSelectOpen, setIsIconSelectOpen] = useState<boolean>(false);

  // Refs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const titleRef = useRef<HTMLInputElement | null>(null);

  const pickerRef = useRef<HTMLDivElement | null>(null);
  const socialMediaRef = useRef<HTMLDivElement | null>(null);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    version: "",
    baseURL: "",
    url: "",
    organizationName: "",
    projectName: "",
    customCSS: customCSSInitial(),
    favicon: "",
    navImageDark: "",
    navImage: "",
    copyrightText: "",
    metaImage: "",
    gitUser: "",
    gitRepo: "",
    gitEmail: "",
    gitPassword: "",
    gitBranch: "",
  });

  const [moreField, setMoreField] = useState<MoreLabelLinks[]>([
    { label: "", link: "" },
  ]);
  const [socialPlatformField, setSocialPlatformField] = useState<
    FooterLabelLinks[]
  >([{ icon: "", link: "" }]);

  const [landingPage, setLandingPage] = useState<LanderDetails>({
    ctaButtonText: {
      ctaButtonLinkLabel: "",
      ctaButtonLink: "",
    },
    secondCtaButtonText: {
      ctaButtonLinkLabel: "",
      ctaButtonLink: "",
    },
    ctaImageLink: "",
    features: [{ emoji: "", title: "", text: "" }],
  });

  useOutsideAlerter(pickerRef, () => setShowEmojiPicker(false));

  useOutsideAlerter(socialMediaRef, () => setIsIconSelectOpen(false));

  useEffect(() => {
    if (isToggleOn || gitDeployOn) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [isToggleOn, gitDeployOn]);

  useEffect(() => {
    if (mode === "edit") {
      const fetchDoc = async () => {
        if (docId !== null) {
          const result = await getDocumentation(docId);

          if (result.status === "success") {
            const data: Documentation = result.data;
            setFormData(data);

            if (data.gitUser) {
              SetGitDeployOn(true);
            }
            const footerLabelLinks: FooterLabelLinks[] = Array.isArray(
              data.footerLabelLinks,
            )
              ? data.footerLabelLinks
              : JSON.parse(data.footerLabelLinks || "[]");

            setSocialPlatformField(footerLabelLinks);
            SetIsAuthenticationToggleOn(data.requireAuth);
            const moreLabelLinks: MoreLabelLinks[] = Array.isArray(
              data?.moreLabelLinks,
            )
              ? data.moreLabelLinks
              : JSON.parse(data.moreLabelLinks || "[]");
            setMoreField(moreLabelLinks);

            const landingPageDetails: LanderDetails = JSON.parse(
              result.data.landerDetails,
            );
            if (Object.keys(landingPageDetails).length !== 0) {
              SetIsToggleOn(true);
              setLandingPage({
                ctaButtonText: {
                  ctaButtonLinkLabel:
                    landingPageDetails.ctaButtonText.ctaButtonLinkLabel,
                  ctaButtonLink: landingPageDetails.ctaButtonText.ctaButtonLink,
                },
                secondCtaButtonText: {
                  ctaButtonLinkLabel:
                    landingPageDetails.secondCtaButtonText.ctaButtonLinkLabel,
                  ctaButtonLink:
                    landingPageDetails.secondCtaButtonText.ctaButtonLink,
                },
                ctaImageLink: landingPageDetails.ctaImageLink,
                features: landingPageDetails.features.map(
                  (feature: Features) => ({
                    emoji: feature.emoji,
                    title: feature.title,
                    text: feature.text,
                  }),
                ),
              });
            }
          } else {
            handleError(result, navigate, t);
          }
        } else {
          console.error("docId is null");
          return;
        }
      };
      fetchDoc();
    } else {
      SetIsToggleOn(false);
      setFormData({
        name: "",
        description: "",
        version: "",
        baseURL: "",
        url: "",
        organizationName: "",
        projectName: "",
        customCSS: customCSSInitial(),
        favicon: "",
        navImageDark: "",
        navImage: "",
        copyrightText: "",
        metaImage: "",
        gitUser: "",
        gitRepo: "",
        gitEmail: "",
        gitPassword: "",
        gitBranch: "",
      });
      SetIsAuthenticationToggleOn(false);
      setSocialPlatformField([{ icon: "", link: "" }]);
      setMoreField([{ label: "", link: "" }]);
      setLandingPage({
        ctaButtonText: {
          ctaButtonLinkLabel: "",
          ctaButtonLink: "",
        },
        secondCtaButtonText: {
          ctaButtonLinkLabel: "",
          ctaButtonLink: "",
        },
        ctaImageLink: "",
        features: [{ emoji: "", title: "", text: "" }],
      });
    }
  }, [docId, mode, navigate]);

  const addRow = (fieldType: string) => {
    if (fieldType === "social-platform-field") {
      setSocialPlatformField([...socialPlatformField, { icon: "", link: "" }]);
    } else if (fieldType === "more") {
      setMoreField([...moreField, { label: "", link: "" }]);
    } else if (fieldType === "feature-filed") {
      setLandingPage((prevState) => ({
        ...prevState,
        features: [...prevState.features, { emoji: "", title: "", text: "" }],
      }));
    }
  };

  const deleteRow = (fieldType: string) => {
    if (fieldType === "social-platform-field") {
      if (socialPlatformField.length >= 0) {
        setSocialPlatformField(socialPlatformField.slice(0, -1));
      }
    } else if (fieldType === "more") {
      if (moreField.length >= 0) {
        setMoreField(moreField.slice(0, -1));
      }
    } else if (fieldType === "feature-filed") {
      if (landingPage.features.length >= 0) {
        setLandingPage((prevState) => ({
          ...prevState,
          features: prevState.features.slice(0, -1),
        }));
      }
    }
  };

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  const [uploadedFiles, setUploadedFiles] = useState<{ [name: string]: { name?: string, uploaded: boolean } }>({
    favicon: {
      name: "",
      uploaded: false
    },
    navImageDark: {
      name: "",
      uploaded: false
    },
    navImage: {
      name: "",
      uploaded: false
    },
    metaImage: {
      name: "",
      uploaded: false
    }
  })

  const handleUploadAssetFile = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name } = e.target

    // check for files

    const { files } = e.target

    if (!files) {
      toastMessage("no_files_selected", "warning")
      return
    }

    const file = files[0]

    const formData = new globalThis.FormData()

    formData.append("upload_tag_name", name)
    formData.append(name, file)

    let res: ApiResponse<{ status: "error" | "success", message: string, file: string }>

    try {
      res = await uploadAssetsFile(formData)
    } catch (error) {

      const err = error as AxiosError
      toastMessage(err.message, "error")
      return
    }
    if (!res.data) {
      toastMessage("no_response_from_server", "error")
      return
    }

    setUploadedFiles((prevData) => ({
      ...prevData,
      [name]: { name: res.data?.file, uploaded: true }
    }))

    toastMessage("updated_file", "success")
    // DEBUG: remove after debug session
    console.log("Uploaded files: ", uploadedFiles)
  }

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } },
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCreateDocument = async () => {
    const validate = validateFormData(formData, gitDeployOn);
    if (validate.status) {
      toastMessage(t(validate.message), "error");
      return;
    }

    const validateCommunity = validateCommunityFields(
      socialPlatformField,
      moreField,
    );

    if (validateCommunity.status) {
      toastMessage(t(validateCommunity.message), "error");
      return;
    }

    if (isToggleOn) {
      const validate = landingPageValidate(landingPage);
      if (validate.status) {
        toastMessage(t(validate.message), "error");
        return;
      }
    }

    const landingData = isToggleOn ? landingPage : {};

    const gitFields = gitDeployOn
      ? {
        gitUser: formData.gitUser || "",
        gitRepo: formData.gitRepo || "",
        gitEmail: formData.gitEmail || "",
        gitPassword: formData.gitPassword || "",
        gitBranch: formData.gitBranch || "",
      }
      : {};

    const payload: DocumentationPayload = {
      id: docId,
      name: formData.name || "",
      description: formData.description || "",
      version: formData.version || "",
      baseURL: formData.baseURL || "",
      url: formData.url || "",
      organizationName: formData.organizationName || "",
      projectName: formData.projectName || "",
      customCSS: formData.customCSS || customCSSInitial(),
      favicon: formData.favicon || "",
      navImageDark: formData.navImageDark || "",
      navImage: formData.navImage || "",
      copyrightText: formData.copyrightText || "",
      metaImage: formData.metaImage || "",
      requireAuth: isAuthenticationToggleOn || false,
      ...gitFields,
      landerDetails: JSON.stringify(landingData),
      footerLabelLinks: socialPlatformField
        ? JSON.stringify(socialPlatformField)
        : [{ icon: "", link: "" }],
      moreLabelLinks: moreField
        ? JSON.stringify(moreField)
        : [{ label: "", link: "" }],
      bucketFavicon: uploadedFiles.favicon.name || "",
      bucketMetaImage: uploadedFiles.metaImage.name || "",
      bucketNavImage: uploadedFiles.navImage.name || "",
      bucketNavImageDark: uploadedFiles.navImageDark.name || ""
    };
    let result;

    setLoadingMessage(t("create_documentation_loading"));
    openModal("loadingModal", null);
    if (mode === "edit") {
      result = await updateDocumentation(payload);
    } else {
      result = await createDocumentation(payload);
    }

    if (handleError(result, navigate, t)) {
      closeModal("loadingModal");
      return;
    }

    if (result.status === "success") {
      closeModal("loadingModal");
      if (docId) {
        navigate(`/dashboard/documentation?id=${docId}`);
      } else {
        navigate("/");
      }
      if (mode === "edit") {
        toastMessage(t("documentation_updated"), "success");
      } else {
        toastMessage(t("documentation_created"), "success");
      }
    }
  };

  const toggleEmojiPicker = (index: number) => {
    if (activeFieldIndex === index) {
      setShowEmojiPicker(!showEmojiPicker);
    } else {
      setActiveFieldIndex(index);
      setShowEmojiPicker(true);
    }
  };

  const handleOptionClick = (option: string, index: number) => {
    setIsIconSelectOpen(false);
    const updatedSocialPlatformField = [...socialPlatformField];
    updatedSocialPlatformField[index] = {
      ...updatedSocialPlatformField[index],
      icon: option,
    };
    setSocialPlatformField(updatedSocialPlatformField);
  };

  const handleArrayFieldChange: HandleArrayFieldChange = (
    index,
    field,
    newValue,
    state,
    saveField,
  ) => {
    const updatedFields = state.map((item, i) =>
      i === index ? { ...item, [field]: newValue } : item,
    );

    if (saveField === "moreFooter") {
      setMoreField(updatedFields as MoreLabelLinks[]);
    } else if (saveField === "socialPlatform") {
      setSocialPlatformField(updatedFields as FooterLabelLinks[]);
    }
  };

  const updateCtaButtonText = (
    key: string,
    value: string,
    state: LanderDetailsKeys,
  ) => {
    setLandingPage((prevState) => {
      const stateObject = prevState[state] as { [key: string]: string };
      return {
        ...prevState,
        [state]: {
          ...stateObject,
          [key]: value,
        },
      };
    });
  };

  const updateFeature = (index: number, key: string, value: string) => {
    const updatedFeatures = landingPage.features.map((feature, i) => {
      if (i === index) {
        return { ...feature, [key]: value };
      }
      return feature;
    });
    setLandingPage((prevState) => ({
      ...prevState,
      features: updatedFeatures,
    }));
  };

  const handleEmojiClick = (
    index: number,
    emojiObject: typeof EmojiClickData,
  ) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    updateFeature(index, "emoji", emojiObject.unified);
    setShowEmojiPicker(false);
  };

  return (
    <AnimatePresence>
      <Breadcrumb />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        key="create-documentation-conatiner"
        className=" overflow-y-auto overflow-x-hidden  justify-center items-center w-full md:inset-0 md:h-full"
      >
        <div className="relative w-full h-full md:h-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-400">
              {mode === "edit"
                ? t("edit_documentation")
                : t("new_documentation")}
            </h3>
          </div>

          <div className="relative bg-white rounded-lg shadow dark:bg-gray-800 sm:p-3">
            <div className="overflow-auto p-1">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-1">
                  <ToggleSwitch
                    name="enableAuthentication"
                    checked={isAuthenticationToggleOn}
                    setChange={SetIsAuthenticationToggleOn}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label={t("title_label")}
                    placeholder={t("enter_new_document_name")}
                    value={formData?.name || ""}
                    onChange={handleChange}
                    name="name"
                    required={true}
                  />
                  <FormField
                    label={t("version")}
                    placeholder={t("version_placeholder")}
                    value={formData?.version}
                    onChange={handleChange}
                    name="version"
                    required={true}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("description")}
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                    <div>
                      <textarea
                        onChange={handleChange}
                        value={formData?.description || ""}
                        name="description"
                        id="description"
                        className="bg-gray-50 border min-h-36 border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder={t("description_placeholder")}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("custom_css")}
                    </span>
                    <AceEditor
                      mode="css"
                      theme={darkMode ? "monokai" : "github"}
                      onChange={(newValue) =>
                        handleChange({
                          target: { name: "customCSS", value: newValue },
                        })
                      }
                      value={formData.customCSS || ""}
                      name="customCSS"
                      editorProps={{ $blockScrolling: true }}
                      setOptions={{
                        useWorker: false,
                        showLineNumbers: true,
                        tabSize: 2,
                      }}
                      style={{ width: "100%", height: "200px" }}
                      className="rounded-lg border border-gray-600"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {/* <FormField */}
                  {/*   label={t("favicon")} */}
                  {/*   placeholder={t("favicon_placeholder")} */}
                  {/*   value={formData?.favicon} */}
                  {/*   onChange={handleChange} */}
                  {/*   name="favicon" */}
                  {/*   type="url" */}
                  {/* /> */}
                  {/* <FormField */}
                  {/*   label={t("navbar_icon_dark")} */}
                  {/*   placeholder={t("navbar_icon_placeholder")} */}
                  {/*   value={formData?.navImageDark} */}
                  {/*   onChange={handleChange} */}
                  {/*   name="navImageDark" */}
                  {/*   type="url" */}
                  {/* /> */}
                  {/* <FormField */}
                  {/*   label={t("navbar_icon")} */}
                  {/*   placeholder={t("navbar_icon_placeholder")} */}
                  {/*   value={formData?.navImage} */}
                  {/*   onChange={handleChange} */}
                  {/*   name="navImage" */}
                  {/*   type="url" */}
                  {/* /> */}

                  <UploadFormField
                    label={t("favicon")}
                    placeholder={t("favicon_placeholder")}
                    onChange={handleUploadAssetFile}
                    name="favicon"
                    uploaded={uploadedFiles.favicon.uploaded}
                  />

                  <UploadFormField
                    label={t("navbar_icon_dark")}
                    placeholder={t("navbar_icon_placeholder")}
                    onChange={handleUploadAssetFile}
                    name="navImageDark"
                    uploaded={uploadedFiles.navImageDark.uploaded}
                  />

                  <UploadFormField
                    label={t("navbar_icon")}
                    placeholder={t("navbar_icon_placeholder")}
                    onChange={handleUploadAssetFile}
                    name="navImage"
                    uploaded={uploadedFiles.navImage.uploaded}
                  />

                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label={t("copyright_text")}
                    placeholder={t("copyright_text_placeholder")}
                    value={formData?.copyrightText}
                    onChange={handleChange}
                    name="copyrightText"
                    required={true}
                  />

                  <UploadFormField
                    label={t("social_card_image")}
                    placeholder={t("social_card_image_palceholder")}
                    onChange={handleUploadAssetFile}
                    name="metaImage"
                    uploaded={uploadedFiles.metaImage.uploaded}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label={t("organization_name")}
                    placeholder={t("organization_name_placeholder")}
                    value={formData?.organizationName}
                    onChange={handleChange}
                    name="organizationName"
                    required={true}
                  />
                  <FormField
                    label={t("project_name")}
                    placeholder={t("project_name_placeholder")}
                    value={formData?.projectName}
                    onChange={handleChange}
                    name="projectName"
                    type="url"
                    required={true}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label={t("documentation_base_url")}
                    placeholder={t("documentation_base_url_placeholder")}
                    value={formData?.baseURL}
                    onChange={handleChange}
                    name="baseURL"
                    required={true}
                  />
                  <FormField
                    label={t("url")}
                    placeholder={t("url_placeholder")}
                    value={formData?.url}
                    onChange={handleChange}
                    name="url"
                    type="url"
                    required={true}
                  />
                </div>
              </div>

              <div className="grid gap-1 mb-4 sm:mb-3 mt-6">
                <div>
                  <div className="flex justify-between items-center">
                    <p className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      {t("social_media_platform")}
                    </p>
                  </div>
                </div>
                <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />
                {socialPlatformField &&
                  socialPlatformField.map((obj, index) => (
                    <div className="grid gap-4 grid-cols-2" key={index}>
                      <div className="relative">
                        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("icon")}
                        </span>
                        <button
                          onClick={() => {
                            setIsIconSelectOpen(!isIconSelectOpen);
                            setOpenDropdownIndex(index);
                          }}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        >
                          {obj.icon ? (
                            <div className="w-full flex justify-start items-center">
                              {(() => {
                                const matchingIcon = SocialLinkIcon.find(
                                  (val) => val.value === obj.icon,
                                );
                                return (
                                  <>
                                    <span>{matchingIcon?.icon}</span>
                                    <span className="ml-2">
                                      {matchingIcon?.iconName}
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <ul className="w-full flex justify-between items-center">
                              <li key="choose_an_icon" className="ml-2">
                                {t("choose_an_icon")}
                              </li>
                              <li key="down-arrow">
                                <Icon
                                  icon="mingcute:down-fill"
                                  className="w-6 h-6"
                                />
                              </li>
                            </ul>
                          )}
                        </button>
                        {openDropdownIndex === index && isIconSelectOpen && (
                          <div
                            ref={socialMediaRef}
                            className="absolute z-10 w-full min-h-48 max-h-48 overflow-auto bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mt-1"
                          >
                            {SocialLinkIcon.map((option) => (
                              <div
                                key={option.value}
                                onClick={() =>
                                  handleOptionClick(option.value, index)
                                }
                                className="flex items-center py-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer"
                              >
                                {option.icon}
                                <span className="ml-2 text-md text-black dark:text-white">
                                  {option.iconName}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormField
                        label={t("link")}
                        placeholder={t("social_link_placeholder")}
                        value={obj.link}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          handleArrayFieldChange(
                            index,
                            "link",
                            e.target.value,
                            socialPlatformField,
                            "socialPlatform",
                          );
                        }}
                        name="url"
                        type="text"
                      />
                    </div>
                  ))}
                <div className="flex justify-end items-center gap-3 my-2">
                  <AddButton
                    onClick={() =>
                      Promise.resolve(addRow("social-platform-field"))
                    }
                  />
                  <DeleteButton
                    onClick={() =>
                      Promise.resolve(deleteRow("social-platform-field"))
                    }
                  />
                </div>
                <div>
                  <div className="flex justify-start items-center">
                    <span className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                      {t("more_footer")}
                    </span>
                  </div>

                  <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />
                  {moreField &&
                    moreField.map((obj, index) => (
                      <div key={`more-label-${index}`}>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="grid gap-4 grid-cols-2 my-2"
                          key={`footer-more-field-${index}`}
                        >
                          <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t("label")}
                            </span>
                            <input
                              type="text"
                              id={`more-label-${index}`}
                              value={obj?.label || ""}
                              name={index.toString()}
                              onChange={(e) =>
                                handleArrayFieldChange(
                                  index,
                                  "label",
                                  e.target.value,
                                  moreField,
                                  "moreFooter",
                                )
                              }
                              placeholder={t("label_placeholder")}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            />
                          </div>
                          <div>
                            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              {t("link")}
                            </span>
                            <input
                              type="text"
                              value={obj?.link || ""}
                              id={`more-link-${index}`}
                              name={index.toString()}
                              onChange={(e) =>
                                handleArrayFieldChange(
                                  index,
                                  "link",
                                  e.target.value,
                                  moreField,
                                  "moreFooter",
                                )
                              }
                              placeholder={t("more_footer_link_placeholder")}
                              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            />
                          </div>
                        </motion.div>
                      </div>
                    ))}
                </div>
                <div className="flex justify-end gap-3 my-2">
                  <AddButton onClick={() => Promise.resolve(addRow("more"))} />
                  <DeleteButton
                    onClick={() => Promise.resolve(deleteRow("more"))}
                  />
                </div>
              </div>

              <div>
                <ToggleSwitch
                  name="enable_landing_page"
                  checked={isToggleOn}
                  setChange={SetIsToggleOn}
                />

                {isToggleOn && (
                  <div className="">
                    <div className="grid gap-4 grid-cols-2 mb-5">
                      <FormField
                        name="cta_button_text_name"
                        label={t("cta_button_text")}
                        placeholder={t("cta_button_text_placeholder")}
                        value={
                          landingPage?.ctaButtonText?.ctaButtonLinkLabel || ""
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          updateCtaButtonText(
                            "ctaButtonLinkLabel",
                            e.target.value,
                            "ctaButtonText",
                          );
                        }}
                        required={true}
                      />

                      <FormField
                        name="cta_button_link_name"
                        label={t("cta_button_link")}
                        placeholder={t("cta_button_link_placeholder")}
                        value={landingPage?.ctaButtonText?.ctaButtonLink}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          updateCtaButtonText(
                            "ctaButtonLink",
                            e.target.value,
                            "ctaButtonText",
                          );
                        }}
                        type="url"
                        required={true}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 mb-5">
                      <FormField
                        name="second_cta_button_text"
                        label={t("second_cta_button_text")}
                        placeholder={t("second_cta_button_text_placeholder")}
                        value={
                          landingPage?.secondCtaButtonText?.ctaButtonLinkLabel
                        }
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCtaButtonText(
                            "ctaButtonLinkLabel",
                            e.target.value,
                            "secondCtaButtonText",
                          )
                        }
                      />
                      <FormField
                        name="second_cta_button_link"
                        label={t("second_cta_button_link")}
                        placeholder={t("second_cta_link_placeholder")}
                        value={landingPage?.secondCtaButtonText?.ctaButtonLink}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          updateCtaButtonText(
                            "ctaButtonLink",
                            e.target.value,
                            "secondCtaButtonText",
                          )
                        }
                        type="url"
                      />
                      <FormField
                        label={t("cta_image_link")}
                        placeholder={t("cta_image_link_palceholder")}
                        value={landingPage.ctaImageLink || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setLandingPage((prevState) => ({
                            ...prevState,
                            ctaImageLink: e.target.value,
                          }))
                        }
                        name="ctaImageLink"
                        type="url"
                        required={true}
                      />
                    </div>

                    <div className="flex justify-start items-center">
                      <span className="block text-md font-medium text-gray-700 dark:text-gray-300 ">
                        {t("features")}
                      </span>
                    </div>
                    <hr className="mt-2 mb-4 border-t-1 dark:border-gray-500" />

                    {landingPage.features.map((obj, index) => (
                      <div className="grid gap-4 grid-cols-3 my-2" key={index}>
                        <div className="relative">
                          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("emoji")}
                          </span>
                          <input
                            ref={(el) => (inputRefs.current[index] = el)}
                            onFocus={() => toggleEmojiPicker(index)}
                            placeholder={`${convertToEmoji("26a1")} ${t("pick_your_emoji")}`}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                            value={convertToEmoji(obj.emoji)}
                            readOnly
                          />
                          {activeFieldIndex === index && showEmojiPicker && (
                            <div
                              ref={pickerRef}
                              className={
                                "absolute left-0 bg-white rounded-lg shadow w-52 dark:bg-gray-700 z-30"
                              }
                              style={{ transform: "translateY(-110%)" }}
                            >
                              <Picker
                                data={data as EmojiMartData}
                                onEmojiSelect={(emoji: typeof EmojiClickData) =>
                                  handleEmojiClick(index, emoji)
                                }
                              />
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("title_label")}
                          </span>
                          <input
                            onChange={(e) =>
                              updateFeature(index, "title", e.target.value)
                            }
                            value={obj.title}
                            type="text"
                            placeholder={t("landing_page_title_placeholder")}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                          />
                        </div>

                        <div className="relative">
                          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("text")}
                          </span>
                          <input
                            onChange={(e) =>
                              updateFeature(index, "text", e.target.value)
                            }
                            value={obj.text}
                            type="text"
                            id="feature_desc"
                            placeholder={t("text_placeholder")}
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-end gap-3 my-2">
                      <AddButton
                        onClick={() => Promise.resolve(addRow("feature-filed"))}
                      />
                      <DeleteButton
                        onClick={() =>
                          Promise.resolve(deleteRow("feature-filed"))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-4">
                <ToggleSwitch
                  name="deploy_to_git"
                  checked={gitDeployOn}
                  setChange={SetGitDeployOn}
                />

                {gitDeployOn && (
                  <div className="">
                    <div className="grid gap-4 grid-cols-2 mb-5">
                      <FormField
                        label={t("git_user")}
                        placeholder={t("git_user_palceholder")}
                        value={formData?.gitUser}
                        onChange={handleChange}
                        name="gitUser"
                        required={true}
                      />

                      <FormField
                        label={t("git_repo")}
                        placeholder={t("git_repo_placeholder")}
                        value={formData?.gitRepo}
                        onChange={handleChange}
                        name="gitRepo"
                        required={true}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3 mb-5">
                      <FormField
                        label={t("git_email")}
                        placeholder={t("git_email_placeholder")}
                        value={formData?.gitEmail}
                        onChange={handleChange}
                        name="gitEmail"
                        required={true}
                      />
                      <FormField
                        label={t("git_password")}
                        placeholder={t("git_password_placeholder")}
                        value={formData?.gitPassword}
                        onChange={handleChange}
                        name="gitPassword"
                        type="password"
                        required={true}
                      />
                      <FormField
                        label={t("git_branch")}
                        placeholder={t("git_branch_palceholder")}
                        value={formData?.gitBranch}
                        onChange={handleChange}
                        name="gitBranch"
                        required={true}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center items-center mt-7">
                <button
                  onClick={handleCreateDocument}
                  type="submit"
                  className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                >
                  <span>
                    {mode === "edit"
                      ? t("update_documentation")
                      : t("new_documentation")}
                  </span>
                  {!mode && <Icon icon="ei:plus" className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
